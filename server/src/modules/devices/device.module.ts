import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Device, DeviceSchema } from './device.entity';
import { DeviceRepository } from './device.repository';
import { DeviceService } from './device.service';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Device.name, schema: DeviceSchema },
        ]),
    ],
    controllers: [],
    providers: [DeviceService, DeviceRepository],
    exports: [DeviceService],
})
export class DeviceModule { }
