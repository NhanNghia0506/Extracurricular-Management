import { Body, Controller, Post } from "@nestjs/common";
import UserService from "./user.service";
import { RegisterDto } from "./dtos/register.dto";

@Controller('users')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Post('register')
    register(@Body() userData: RegisterDto) {
        
    }
}