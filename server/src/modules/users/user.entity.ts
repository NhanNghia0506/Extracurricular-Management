import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { UserRole } from "src/global/globalEnum";

export type UserDocument = User & Document;
@Schema({ timestamps: true })
export class User {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true, unique: true })
    email: string;

    @Prop({ required: true })
    password: string;

    @Prop({ 
        required: true,
        enum: Object.values(UserRole),
    })
    role: UserRole;

    @Prop({ required: true })
    status: number;

    @Prop()
    avatar: string;
}

export const UserSchema = SchemaFactory.createForClass(User);