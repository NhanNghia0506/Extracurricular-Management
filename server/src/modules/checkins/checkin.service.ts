import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { CheckinRepository } from './checkin.repository';
import { CreateCheckinDto } from './dtos/create.checkin.dto';
import { Checkin } from './checkin.entity';
import { CheckinSessionService } from '../checkin-sessions/checkin-session.service';
import { calculateHaversineDistance, isLocationWithinRadius } from 'src/utils/haversine.util';
import { CheckinStatus } from 'src/global/globalEnum';
import { ActivityParticipantService } from '../activity-participants/activity-participant.service';
import { ParticipantStatus } from '../activity-participants/activity-participant.entity';
import { CheckinGateway } from 'src/events/checkin.gateway';
import StudentService from '../students/student.service';
import UserService from '../users/user.service';
import { StudentProfile } from 'src/global/globalInterface';

@Injectable()
export class CheckinService {
    constructor(
        private readonly checkinRepository: CheckinRepository,
        private readonly checkinSessionService: CheckinSessionService,
        private readonly activityParticipantService: ActivityParticipantService,
        private readonly checkinGateway: CheckinGateway,
        private readonly studentService: StudentService,
        private readonly userService: UserService,
    ) { }

    /**
     * Kiểm tra xem thiết bị đã check-in thành công trong session này chưa
     */
    private async hasDeviceCheckedInSuccessfully(
        checkinSessionId: string,
        deviceId: string,
    ): Promise<boolean> {
        try {
            const existingCheckin = await this.checkinRepository.findOneBySessionAndDevice(
                checkinSessionId,
                deviceId,
                CheckinStatus.SUCCESS,
            );
            return !!existingCheckin;
        } catch {
            // Nếu có lỗi, trả về false
            return false;
        }
    }

    async create(createCheckinDto: CreateCheckinDto) {
        const checkinSession = await this.checkinSessionService.findById(createCheckinDto.checkinSessionId);
        if (!checkinSession) {
            throw new NotFoundException('Không tìm thấy check-in session');
        }

        // Kiểm tra xem check-in session có đang hoạt động không
        const now = new Date();
        if (now < checkinSession.startTime || now > checkinSession.endTime) {
            throw new BadRequestException('Check-in session không đang hoạt động');
        }

        // Kiểm tra xem thiết bị đã check-in thành công trong session này chưa
        const hasDeviceCheckedIn = await this.hasDeviceCheckedInSuccessfully(
            createCheckinDto.checkinSessionId,
            createCheckinDto.deviceId,
        );

        if (hasDeviceCheckedIn) {
            throw new BadRequestException('Thiết bị này đã check-in thành công cho session này rồi. Chỉ cho phép 1 check-in thành công/thiết bị/session');
        }

        // Tính khoảng cách
        const distance = calculateHaversineDistance(
            createCheckinDto.latitude,
            createCheckinDto.longitude,
            checkinSession.location.latitude,
            checkinSession.location.longitude,
        );

        const participant = await this.activityParticipantService.findByActivityAndUserId(
            checkinSession.activityId.toString(),
            createCheckinDto.userId
        );

        if (!participant) {
            throw new BadRequestException('Bạn chưa tham gia hoạt động này');
        }

        if (participant.status && participant.status !== ParticipantStatus.APPROVED) {
            throw new BadRequestException('Bạn chưa được phê duyệt tham gia hoạt động này');
        }

        let checkin: Checkin;

        // Kiểm tra vị trí người dùng có trong vòng tròn chưa
        if (!isLocationWithinRadius(
            createCheckinDto.latitude,
            createCheckinDto.longitude,
            checkinSession.location.latitude,
            checkinSession.location.longitude,
            checkinSession.radiusMetters)) {

            checkin = {
                checkinSessionId: new Types.ObjectId(createCheckinDto.checkinSessionId),
                userId: new Types.ObjectId(createCheckinDto.userId),
                latitude: createCheckinDto.latitude,
                longitude: createCheckinDto.longitude,
                distance,
                status: CheckinStatus.FAILED,
                failReason: `Vị trí cách ${distance.toFixed(2)}m, giới hạn ${checkinSession.radiusMetters}m`,
                deviceId: createCheckinDto.deviceId,
            } as Checkin;
        } else {
            checkin = {
                checkinSessionId: new Types.ObjectId(createCheckinDto.checkinSessionId),
                userId: new Types.ObjectId(createCheckinDto.userId),
                latitude: createCheckinDto.latitude,
                longitude: createCheckinDto.longitude,
                distance,
                status: CheckinStatus.SUCCESS,
                deviceId: createCheckinDto.deviceId,
            } as Checkin;
        }

        const savedCheckin = await this.checkinRepository.create(checkin);

        // Emit event khi checkin xong (non-blocking)
        void this.emitCheckinEventAsync(savedCheckin, createCheckinDto.userId);

        return savedCheckin;
    }

    /**
     * Helper method to emit checkin event with fallback for non-student users
     */
    private async emitCheckinEventAsync(checkin: Checkin, userId: string) {
        try {
            let studentProfile: StudentProfile;

            try {
                // Thử lấy thông tin student đầy đủ
                studentProfile = await this.studentService.getStudentFullInfo(userId);
                console.log('Student profile loaded:', studentProfile);
            } catch (studentError) {
                // Nếu không tìm thấy student record, fallback lấy từ user
                const errorMessage = studentError instanceof Error ? studentError.message : String(studentError);
                console.warn('Student record not found, using user fallback:', errorMessage);

                const user = await this.userService.getProfile(userId);
                studentProfile = {
                    id: userId,
                    mssv: 'N/A',
                    name: user.name || 'Unknown',
                    email: user.email || '',
                    avatar: user.avatar || '',
                    class: 'N/A',
                    faculty: 'N/A',
                };
                console.log('Fallback user profile created:', studentProfile);
            }

            this.checkinGateway.emitNewCheckin({
                checkin: checkin,
                student: studentProfile,
            });
            console.log('CheckinGateway.emitNewCheckin called successfully');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorStack = error instanceof Error ? error.stack : '';
            console.error('Error in emitNewCheckin flow:', errorMessage);
            console.error('Stack:', errorStack);
        }
    }

    /**
     * Lấy danh sách người đã checkin theo sessionId kèm thông tin đầy đủ
     * @param checkinSessionId - ID của checkin session
     * @param status - (Optional) Lọc theo trạng thái (SUCCESS, FAILED, etc.)
     */
    async getCheckinsBySessionId(checkinSessionId: string, status?: CheckinStatus) {
        // Validate session tồn tại
        const session = await this.checkinSessionService.findById(checkinSessionId);
        if (!session) {
            throw new NotFoundException('Không tìm thấy checkin session');
        }

        // Lấy danh sách checkin
        const checkins = await this.checkinRepository.findBySessionId(checkinSessionId, status);

        // Populate thông tin user/student cho từng checkin
        const checkinList = await Promise.all(
            checkins.map(async (checkin) => {
                try {
                    // Thử lấy thông tin student đầy đủ
                    const studentProfile = await this.studentService.getStudentFullInfo(
                        checkin.userId.toString(),
                    );

                    return {
                        distance: checkin.distance,
                        status: checkin.status,
                        failReason: checkin.failReason,
                        createdAt: checkin.createdAt,
                        student: studentProfile,
                    };
                } catch {
                    // Fallback: nếu không tìm thấy student, lấy từ user
                    const user = await this.userService.getProfile(checkin.userId.toString());
                    return {
                        
                        distance: checkin.distance,
                        status: checkin.status,
                        failReason: checkin.failReason,
                        createdAt: checkin.createdAt,
                        student: {
                            id: user.id.toString(),
                            mssv: 'N/A',
                            name: user.name || 'Unknown',
                            email: user.email || '',
                            avatar: user.avatar || '',
                            class: 'N/A',
                            faculty: 'N/A',
                        },
                    };
                }
            }),
        );

        return {
            total: checkinList.length,
            data: checkinList,
        };
    }

}
