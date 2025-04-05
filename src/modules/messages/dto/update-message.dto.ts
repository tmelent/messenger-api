import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class UpdateMessageDto {
    @IsUUID()
    @IsNotEmpty()
    messageId: string;

    @IsString()
    @IsNotEmpty()
    text: string;
}