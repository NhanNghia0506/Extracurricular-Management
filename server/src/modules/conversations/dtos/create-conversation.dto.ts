import { IsString, IsNotEmpty, IsMongoId, IsBoolean, IsOptional } from 'class-validator';

export class CreateConversationDto {
    @IsMongoId()
    @IsNotEmpty()
    activityId: string;

    @IsString()
    @IsNotEmpty()
    title: string;

    @IsBoolean()
    @IsOptional()
    addAllMembers?: boolean;
}
