import { BadRequestException, Body, Controller, Get, Patch, Post, Req, UnauthorizedException, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import type { Request } from "express";
import UserService from "./user.service";
import { RegisterUserDto } from "./dtos/register.dto";
import { LoginDto } from "./dtos/login.dto";
import { UpdateProfileDto } from "./dtos/update-profile.dto";
import { ResponseMessage } from "src/decorators/response-message.decorator";
import { AuthGuard } from "src/guards/auth.guard";
import { createUploadImageInterceptor } from "src/interceptors/upload-image.interceptor";

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) { }
    // Register a new user (student or teacher)
    @ResponseMessage('User registered successfully')
    @Post('register')
    register(@Body() userData: RegisterUserDto) {
        return this.userService.register(userData);
    }

    // Login user
    @ResponseMessage('Login successful')
    @Post('login')
    login(@Body() loginData: LoginDto) {
        return this.userService.login(loginData);
    }

    @UseGuards(AuthGuard)
    @ResponseMessage('Lấy thông tin người dùng thành công')
    @Get('me')
    getMe(@Req() req: Request) {
        const userId = req.user?.id;
        if (!userId) {
            throw new UnauthorizedException('User not authenticated');
        }
        return this.userService.getProfile(userId);
    }

    @UseGuards(AuthGuard)
    @ResponseMessage('Cập nhật thông tin người dùng thành công')
    @Patch('me')
    updateMe(@Req() req: Request, @Body() updateProfileDto: UpdateProfileDto) {
        const userId = req.user?.id;
        if (!userId) {
            throw new UnauthorizedException('User not authenticated');
        }

        return this.userService.updateProfile(userId, updateProfileDto);
    }

    @UseGuards(AuthGuard)
    @UseInterceptors(createUploadImageInterceptor())
    @ResponseMessage('Cập nhật ảnh đại diện thành công')
    @Patch('me/avatar')
    updateAvatar(@Req() req: Request, @UploadedFile() file?: Express.Multer.File) {
        const userId = req.user?.id;
        if (!userId) {
            throw new UnauthorizedException('User not authenticated');
        }

        if (!file?.filename) {
            throw new BadRequestException('Vui lòng chọn ảnh đại diện');
        }

        return this.userService.updateAvatar(userId, `/uploads/${file.filename}`);
    }
}