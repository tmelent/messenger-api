import { PaginationDto } from '../../common/dto/pagination.dto';
import { IsNotEmpty, IsString } from 'class-validator';

export class GetMessagesDto extends PaginationDto {
    @IsString()
    @IsNotEmpty()
    chatId: string;
}