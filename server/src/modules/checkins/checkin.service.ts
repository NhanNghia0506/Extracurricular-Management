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

@Injectable()
export class CheckinService {
    constructor(
        private readonly checkinRepository: CheckinRepository,
        private readonly checkinSessionService: CheckinSessionService,
        private readonly activityParticipantService: ActivityParticipantService,
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

        if (!participant || participant.status !== ParticipantStatus.APPROVED) {
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

        return this.checkinRepository.create(checkin);
    }
}
