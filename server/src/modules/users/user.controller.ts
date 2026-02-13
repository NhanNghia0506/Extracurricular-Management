import { Body, Controller, Get, Post, Req, UnauthorizedException, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import UserService from "./user.service";
import { RegisterUserDto } from "./dtos/register.dto";
import { LoginDto } from "./dtos/login.dto";
import { ResponseMessage } from "src/decorators/response-message.decorator";
import { AuthGuard } from "src/guards/auth.guard";

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
}