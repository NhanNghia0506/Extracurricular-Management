import { Body, Controller, Get, Post } from "@nestjs/common";
import UserService from "./user.service";
import { RegisterDto } from "./dtos/register.dto";
import { ResponseMessage } from "src/decorators/response-message.decorator";

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}
    // Register a new student
    @ResponseMessage('User registered successfully')
    @Post('register')
    createStudent(@Body() userData: RegisterDto) {
        return this.userService.register(userData);
    }

    @Get('profile')
    getProfile() {
        return 'Hello';
    }
}