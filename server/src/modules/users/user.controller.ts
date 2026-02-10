import { Body, Controller, Post } from "@nestjs/common";
import UserService from "./user.service";
import { RegisterUserDto } from "./dtos/register.dto";
import { LoginDto } from "./dtos/login.dto";
import { ResponseMessage } from "src/decorators/response-message.decorator";

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
}