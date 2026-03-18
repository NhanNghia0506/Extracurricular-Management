import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { CheckinRepository } from './checkin.repository';
import { CreateCheckinDto } from './dtos/create.checkin.dto';
import { Checkin } from './checkin.entity';
import { CheckinSessionService } from '../checkin-sessions/checkin-session.service';
import { calculateHaversineDistance, isLocationWithinRadius } from 'src/utils/haversine.util';
import { CheckinStatus, UserRole } from 'src/global/globalEnum';
import { ActivityParticipantService } from '../activity-participants/activity-participant.service';
import { ParticipantStatus } from '../activity-participants/activity-participant.entity';
import { CheckinGateway } from 'src/events/checkin.gateway';
import StudentService from '../students/student.service';
import UserService from '../users/user.service';
import { StudentProfile } from 'src/global/globalInterface';
import { ManualCheckinDto } from './dtos/manual.checkin.dto';

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
     * Kiểm tra xem thiết bị đã check-in thành công (SUCCESS hoặc LATE) trong session này chưa
     */
    private async hasDeviceCheckedInSuccessfully(
        checkinSessionId: string,
        deviceId: string,
    ): Promise<boolean> {
        try {
            const existingCheckin = await this.checkinRepository.findOneBySessionAndDevice(
                checkinSessionId,
                deviceId,
                [CheckinStatus.SUCCESS, CheckinStatus.LATE],
            );
            return !!existingCheckin;
        } catch {
            return false;
        }
    }

    private async hasUserCheckedInSuccessfully(
        checkinSessionId: string,
        userId: string,
    ): Promise<boolean> {
        try {
            const existingCheckin = await this.checkinRepository.findOneBySessionAndUser(
                checkinSessionId,
                userId,
                [CheckinStatus.SUCCESS, CheckinStatus.LATE],
            );
            return !!existingCheckin;
        } catch {
            return false;
        }
    }

    async create(
        createCheckinDto: CreateCheckinDto,
        actorUserId: string,
        actorRole?: string,
    ) {
        if (actorRole !== UserRole.ADMIN && createCheckinDto.userId !== actorUserId) {
            throw new ForbiddenException('Bạn không thể điểm danh thay người khác');
        }

        const checkinSession = await this.checkinSessionService.findById(createCheckinDto.checkinSessionId);
        if (!checkinSession) {
            throw new NotFoundException('Không tìm thấy check-in session');
        }

        // Kiểm tra xem check-in session có đang hoạt động không
        const now = new Date();
        if (now < checkinSession.startTime) {
            throw new BadRequestException('Check-in session chưa diễn ra');
        }

        if (now > checkinSession.endTime) {
            throw new BadRequestException('Check-in session đã kết thúc');
        }

        // Kiểm tra xem thiết bị đã check-in thành công trong session này chưa
        const hasDeviceCheckedIn = await this.hasDeviceCheckedInSuccessfully(
            createCheckinDto.checkinSessionId,
            createCheckinDto.deviceId,
        );

        if (hasDeviceCheckedIn) {
            throw new BadRequestException('Thiết bị này đã check-in thành công cho session này rồi. Chỉ cho phép 1 check-in thành công/thiết bị/session');
        }

        const hasUserCheckedIn = await this.hasUserCheckedInSuccessfully(
            createCheckinDto.checkinSessionId,
            createCheckinDto.userId,
        );
        if (hasUserCheckedIn) {
            throw new BadRequestException('Người dùng này đã điểm danh thành công cho session này rồi');
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
            // Xác định LATE nếu phiên có cấu hình lateAfter và thời điểm hiện tại vượt quá ngưỡng
            const checkinStatus = (checkinSession.lateAfter && now > checkinSession.lateAfter)
                ? CheckinStatus.LATE
                : CheckinStatus.SUCCESS;

            checkin = {
                checkinSessionId: new Types.ObjectId(createCheckinDto.checkinSessionId),
                userId: new Types.ObjectId(createCheckinDto.userId),
                latitude: createCheckinDto.latitude,
                longitude: createCheckinDto.longitude,
                distance,
                status: checkinStatus,
                deviceId: createCheckinDto.deviceId,
            } as Checkin;
        }

        const savedCheckin = await this.checkinRepository.create(checkin);

        // Emit event khi checkin xong (non-blocking)
        void this.emitCheckinEventAsync(savedCheckin, createCheckinDto.userId);

        return savedCheckin;
    }

    async createManual(
        manualCheckinDto: ManualCheckinDto,
        actorUserId: string,
        actorRole?: string,
    ) {
        const checkinSession = await this.checkinSessionService.findById(manualCheckinDto.checkinSessionId);
        if (!checkinSession) {
            throw new NotFoundException('Không tìm thấy check-in session');
        }

        const now = new Date();
        if (now < checkinSession.startTime) {
            throw new BadRequestException('Check-in session chưa diễn ra');
        }

        if (now > checkinSession.endTime) {
            throw new BadRequestException('Check-in session đã kết thúc');
        }

        const activity = await this.checkinSessionService.findActivityBySessionId(manualCheckinDto.checkinSessionId);
        if (!activity) {
            throw new NotFoundException('Không tìm thấy hoạt động của check-in session');
        }

        const isOwner = activity.createdBy?.toString() === actorUserId;
        const isAdmin = actorRole === UserRole.ADMIN;
        if (!isOwner && !isAdmin) {
            throw new ForbiddenException('Chỉ chủ hoạt động hoặc admin mới có quyền điểm danh thủ công');
        }

        const participant = await this.activityParticipantService.findByActivityAndUserId(
            checkinSession.activityId.toString(),
            manualCheckinDto.userId,
        );

        if (!participant) {
            throw new BadRequestException('Người dùng này chưa tham gia hoạt động');
        }

        if (participant.status && participant.status !== ParticipantStatus.APPROVED) {
            throw new BadRequestException('Người dùng này chưa được phê duyệt tham gia hoạt động');
        }

        const hasUserCheckedIn = await this.hasUserCheckedInSuccessfully(
            manualCheckinDto.checkinSessionId,
            manualCheckinDto.userId,
        );
        if (hasUserCheckedIn) {
            throw new BadRequestException('Người dùng này đã điểm danh thành công cho session này rồi');
        }

        const manualCheckin: Checkin = {
            checkinSessionId: new Types.ObjectId(manualCheckinDto.checkinSessionId),
            userId: new Types.ObjectId(manualCheckinDto.userId),
            latitude: checkinSession.location.latitude,
            longitude: checkinSession.location.longitude,
            distance: 0,
            status: CheckinStatus.SUCCESS,
            deviceId: `manual:${actorUserId}:${manualCheckinDto.userId}`,
        } as Checkin;

        const savedCheckin = await this.checkinRepository.create(manualCheckin);

        void this.emitCheckinEventAsync(savedCheckin, manualCheckinDto.userId);

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
                        _id: checkin._id,
                        userId: checkin.userId,
                        latitude: checkin.latitude,
                        longitude: checkin.longitude,
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
                        _id: checkin._id,
                        userId: checkin.userId,
                        latitude: checkin.latitude,
                        longitude: checkin.longitude,
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
