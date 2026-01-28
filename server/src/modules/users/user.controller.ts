import { Body, Controller, Post } from "@nestjs/common";
import UserService from "./user.service";
import { RegisterStudentDto, RegisterTeacherDto } from "./dtos/register.dto";
import { LoginDto } from "./dtos/login.dto";
import { ResponseMessage } from "src/decorators/response-message.decorator";

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) { }
    // Register a new student
    @ResponseMessage('User registered successfully')
    @Post('create-student')
    createStudent(@Body() userData: RegisterStudentDto) {
        return this.userService.createStudent(userData);
    }

    // Register a new teacher
    @ResponseMessage('User registered successfully')
    @Post('create-teacher')
    createTeacher(@Body() userData: RegisterTeacherDto) {
        return this.userService.createTeacher(userData);
    }

    // Login student
    @ResponseMessage('Login successful')
    @Post('login')
    login(@Body() loginData: LoginDto) {
        return this.userService.login(loginData);
    }
}