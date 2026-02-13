import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";
import { CustomJwtPayload } from "src/global/globalInterface";

@Injectable()
export class OptionalAuthGuard implements CanActivate {
    constructor(private jwtService: JwtService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();
        const token = this.extractTokenFromHeader(request);
        if (!token) {
            return true;
        }

        try {
            const payload = await this.jwtService.verifyAsync<CustomJwtPayload>(token);
            request.user = {
                id: payload.sub,
                email: payload.email,
                name: payload.name,
                role: payload.role,
            };
        } catch {
            return true;
        }

        return true;
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}
