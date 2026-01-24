import {
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage, StorageEngine } from 'multer';
import { Request } from 'express';
import * as path from 'path';
import * as fs from 'fs';

// Cấu hình lưu trữ cho multer
const createStorageConfig = (): StorageEngine => {
    return diskStorage({
        destination: (
            req: Request,
            file: Express.Multer.File,
            cb: (error: Error | null, destination: string) => void,
        ): void => {
            const uploadPath: string = path.join(process.cwd(), 'uploads');

            // Tạo thư mục nếu chưa tồn tại
            if (!fs.existsSync(uploadPath)) {
                fs.mkdirSync(uploadPath, { recursive: true });
            }

            cb(null, uploadPath);
        },

        filename: (
            req: Request,
            file: Express.Multer.File,
            cb: (error: Error | null, filename: string) => void,
        ): void => {
            // Tạo tên file duy nhất: timestamp + random string + extension
            const uniqueSuffix: string =
                Date.now() + '-' + Math.round(Math.random() * 1e9);
            const ext: string = path.extname(file.originalname);
            const name: string = path.basename(file.originalname, ext);

            cb(null, `${name}-${uniqueSuffix}${ext}`);
        },
    });
};

// Hàm kiểm tra loại file
const fileFilter = (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, acceptFile: boolean) => void,
): void => {
    // Các loại ảnh được phép
    const allowedMimes: string[] = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
    ];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(
            new BadRequestException(
                'Chỉ cho phép upload các file ảnh (JPEG, PNG, GIF, WebP)',
            ),
            false,
        );
    }
};

// Factory function để tạo UploadImageInterceptor
export const createUploadImageInterceptor = () =>
    FileInterceptor('image', {
        storage: createStorageConfig(),
        fileFilter: fileFilter,
        limits: {
            fileSize: 5 * 1024 * 1024, // Giới hạn 5MB
        },
    });

// Factory function để tạo UploadMultipleImagesInterceptor
export const createUploadMultipleImagesInterceptor = () =>
    FilesInterceptor('images', 10, {
        storage: createStorageConfig(),
        fileFilter: fileFilter,
        limits: {
            fileSize: 5 * 1024 * 1024, // Giới hạn 5MB cho mỗi file
        },
    });
