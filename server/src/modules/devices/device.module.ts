import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Device, DeviceSchema } from './device.entity';
import { DeviceRepository } from './device.repository';
import { DeviceService } from './device.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Device.name, schema: DeviceSchema },
        ]),
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'your-secret-key',
            signOptions: { expiresIn: '7d' },
        }),
    ],
    controllers: [],
    providers: [DeviceService, DeviceRepository],
    exports: [DeviceService],
})
export class DeviceModule { }
