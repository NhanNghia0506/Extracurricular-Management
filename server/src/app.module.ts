import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './modules/users/user.module';
import { StudentModule } from './modules/students/student.module';
import { AcademicModule } from './modules/academic/academic.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/extracurricular_management_db'),
    UserModule,
    StudentModule,
    AcademicModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
