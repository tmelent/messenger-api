import { IsNotEmpty, IsUUID } from 'class-validator';

export class DeleteMessageDto {
    @IsUUID()
    @IsNotEmpty()
    messageId: string;
}