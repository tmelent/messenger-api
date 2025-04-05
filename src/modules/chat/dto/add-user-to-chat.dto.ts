import { IsUUID } from 'class-validator';

export class AddUserToChatDto {
    @IsUUID()
    userId: string;
}
