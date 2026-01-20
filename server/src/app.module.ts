import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './modules/users/user.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/extracurricular_management_db'),
    UserModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
