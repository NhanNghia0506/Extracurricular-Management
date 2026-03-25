import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { UserRole } from 'src/global/globalEnum';

@Injectable()
export class AdminGuard implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();
        const user = request.user;

        if (!user || !user.id) {
            throw new UnauthorizedException('User not authenticated');
        }

        if (user.role !== UserRole.ADMIN) {
            throw new ForbiddenException('Only administrators can perform this action');
        }

        return true;
    }
}
