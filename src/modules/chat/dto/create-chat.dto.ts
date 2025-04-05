import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateChatDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsBoolean()
    isPrivate: boolean;

    @IsArray()
    @IsOptional()
    @IsUUID('4', { each: true })
    participants?: string[];
}
