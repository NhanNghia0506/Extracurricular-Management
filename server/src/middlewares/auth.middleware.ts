import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from 'jsonwebtoken';

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                role: string;
            };
        }
    }
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
    constructor(private readonly jwtService: JwtService) { }

    use(req: Request, res: Response, next: NextFunction) {
        // Lấy token từ Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            throw new UnauthorizedException('Token không tồn tại');
        }

        // Tách token từ "Bearer <token>"
        const token = authHeader.startsWith('Bearer ')
            ? authHeader.slice(7)
            : authHeader;

        try {
            // Verify token
            const decoded = this.jwtService.verify<JwtPayload>(token);
            // Attach user info vào request để dùng ở controller
            req.user = {
                id: decoded.sub as string,
                email: decoded.email as string,
                role: decoded.role as string,
            };

            // Trả về role của client
            res.setHeader('X-User-Role', decoded.role as string);

            next();
        } catch {
            throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
        }
    }
}
