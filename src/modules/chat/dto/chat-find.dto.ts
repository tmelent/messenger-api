import { UserFindDto } from '../../user/dto/user-find.dto';

export class ChatFindDto {
    id: string;
    name: string;
    createdAt: Date;
    deletedAt?: Date;
    isPrivate: boolean;
    createdBy: UserFindDto;
    participants: UserFindDto[];
}