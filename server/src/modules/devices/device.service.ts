import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { DeviceRepository } from './device.repository';
import { Device } from './device.entity';

@Injectable()
export class DeviceService {
    constructor(
        private readonly deviceRepository: DeviceRepository,
    ) { }

    /**
     * Tìm hoặc tạo mới device
     * @param deviceId - Device fingerprint hash
     * @param userId - User ID đang sử dụng device
     * @throws Error nếu device đã được sử dụng bởi 2 users khác
     */
    async findOrCreateDevice(deviceId: string, userId: string) {
        const existingDevice = await this.deviceRepository.findById(deviceId);

        if (existingDevice) {
            const userObjectId = new Types.ObjectId(userId);
            const isUserAlreadyRegistered = existingDevice.userIds.some(id => id.equals(userObjectId));

            // Kiểm tra nếu device đã có 2 users và user hiện tại không nằm trong danh sách
            if (existingDevice.userIds.length >= 2 && !isUserAlreadyRegistered) {
                throw new Error('Thiết bị này đã đạt giới hạn 2 tài khoản. Không thể đăng nhập thêm.');
            }

            // Cập nhật lastSeen
            await this.deviceRepository.updateLastSeen(deviceId, new Date());

            // Thêm userId vào danh sách nếu chưa có
            if (!isUserAlreadyRegistered) {
                await this.deviceRepository.addUserToDevice(deviceId, userObjectId);
            }

            return existingDevice;
        }

        // Tạo device mới
        const now = new Date();
        const newDevice: Partial<Device> = {
            id: deviceId,
            userIds: [new Types.ObjectId(userId)],
            firstSeen: now,
            lastSeen: now,
        };

        return this.deviceRepository.create(newDevice);
    }

    /**
     * Lấy tất cả devices của một user
     */
    async getDevicesByUserId(userId: string) {
        return this.deviceRepository.findByUserId(userId);
    }

    /**
     * Lấy device theo ID
     */
    async getDeviceById(deviceId: string) {
        return this.deviceRepository.findById(deviceId);
    }

    /**
     * Kiểm tra xem device đã được sử dụng bởi nhiều user chưa
     */
    async isDeviceShared(deviceId: string): Promise<boolean> {
        const device = await this.deviceRepository.findById(deviceId);
        return device ? device.userIds.length > 1 : false;
    }

    /**
     * Lấy tất cả users đã sử dụng device này
     */
    async getUsersByDevice(deviceId: string): Promise<Types.ObjectId[]> {
        const device = await this.deviceRepository.findById(deviceId);
        return device ? device.userIds : [];
    }

    /**
     * Lấy tất cả devices
     */
    async getAllDevices() {
        return this.deviceRepository.findAll();
    }
}
