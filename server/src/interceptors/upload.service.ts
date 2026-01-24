import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadService {
  private readonly uploadDir: string = path.join(process.cwd(), 'uploads');

  constructor() {
    // Đảm bảo thư mục uploads tồn tại
    try {
      if (!fs.existsSync(this.uploadDir)) {
        fs.mkdirSync(this.uploadDir, { recursive: true });
      }
    } catch (error) {
      throw new InternalServerErrorException(
        'Lỗi khi tạo thư mục uploads',
      );
    }
  }

  /**
   * Lấy URL đầy đủ của file đã upload
   * @param filename - Tên file
   * @returns URL của file
   */
  getFileUrl(filename: string): string {
    return `/uploads/${filename}`;
  }

  /**
   * Xóa file
   * @param filename - Tên file cần xóa
   * @throws Error nếu file không tồn tại hoặc lỗi khi xóa
   */
  deleteFile(filename: string): void {
    const filePath: string = path.join(this.uploadDir, filename);

    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      } else {
        throw new Error('File không tồn tại');
      }
    } catch (error) {
      throw new InternalServerErrorException(
        `Lỗi khi xóa file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Lấy thông tin file
   * @param filename - Tên file
   * @returns Thông tin file hoặc null nếu không tồn tại
   */
  getFileStats(filename: string): fs.Stats | null {
    const filePath: string = path.join(this.uploadDir, filename);

    try {
      if (fs.existsSync(filePath)) {
        return fs.statSync(filePath);
      }
      return null;
    } catch (error) {
      throw new InternalServerErrorException(
        `Lỗi khi lấy thông tin file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Lấy tất cả file trong thư mục uploads
   * @returns Mảng tên file
   */
  getAllFiles(): string[] {
    try {
      if (fs.existsSync(this.uploadDir)) {
        return fs.readdirSync(this.uploadDir);
      }
      return [];
    } catch (error) {
      throw new InternalServerErrorException(
        `Lỗi khi đọc thư mục uploads: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Lấy kích thước tổng cộng của tất cả file (bytes)
   * @returns Kích thước tổng cộng
   */
  getTotalSize(): number {
    const files: string[] = this.getAllFiles();
    let totalSize: number = 0;

    try {
      files.forEach((file: string): void => {
        const filePath: string = path.join(this.uploadDir, file);
        const stats: fs.Stats = fs.statSync(filePath);
        totalSize += stats.size;
      });

      return totalSize;
    } catch (error) {
      throw new InternalServerErrorException(
        `Lỗi khi tính toán kích thước: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Kiểm tra xem file có tồn tại không
   * @param filename - Tên file
   * @returns True nếu file tồn tại, false nếu không
   */
  fileExists(filename: string): boolean {
    const filePath: string = path.join(this.uploadDir, filename);
    return fs.existsSync(filePath);
  }

  /**
   * Lấy đường dẫn đầy đủ của file
   * @param filename - Tên file
   * @returns Đường dẫn đầy đủ
   */
  getFilePath(filename: string): string {
    return path.join(this.uploadDir, filename);
  }
}
