import { IsNotEmpty, IsBoolean, IsMongoId } from 'class-validator';

export class CreateOrganizerMemberDto {
    @IsMongoId()
    @IsNotEmpty()
    userId: string;

    @IsMongoId()
    @IsNotEmpty()
    organizerId: string;

    @IsBoolean()
    @IsNotEmpty()
    isActive: boolean;
}
