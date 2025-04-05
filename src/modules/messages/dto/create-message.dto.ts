import { IsNotEmpty, IsUUID, IsString } from 'class-validator';

export class CreateMessageDto {
    @IsUUID()
    @IsNotEmpty()
    chatId: string;

    @IsString()
    @IsNotEmpty()
    text: string;
}
