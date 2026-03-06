import { IsNotEmpty, IsMongoId, IsEnum, IsOptional } from 'class-validator';

export class AddMemberDto {
    @IsMongoId()
    @IsNotEmpty()
    userId: string;

    @IsEnum(['member', 'admin'])
    @IsOptional()
    role?: string = 'member';
}
