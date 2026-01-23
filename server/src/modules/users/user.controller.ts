import { Body, Controller, Post } from "@nestjs/common";
import UserService from "./user.service";
import { RegisterDto } from "./dtos/register.dto";
import { LoginDto } from "./dtos/login.dto";
import { ResponseMessage } from "src/decorators/response-message.decorator";

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) { }
    // Register a new student
    @ResponseMessage('User registered successfully')
    @Post('create-student')
    createStudent(@Body() userData: RegisterDto) {
        return this.userService.createStudent(userData);
    }

    // Login
    @ResponseMessage('Login successful')
    @Post('login')
    login(@Body() loginData: LoginDto) {
        return this.userService.login(loginData);
    }
}