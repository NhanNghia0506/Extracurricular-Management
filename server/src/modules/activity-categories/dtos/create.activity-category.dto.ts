import { IsString, IsNotEmpty } from 'class-validator';

export class CreateActivityCategoryDto {
    @IsString()
    @IsNotEmpty()
    name: string;
}
