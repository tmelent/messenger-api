import { UserFindDto } from '../../user/dto/user-find.dto';
import { ChatFindDto } from '../../chat/dto/chat-find.dto';
import { Message } from '../entities/message.entity';
import { EncryptionService } from '../../common/encryption.service';
import { Expose, Type } from 'class-transformer';

export class MessageFindDto {
    @Expose()
    id: string;

    @Expose()
    createdAt: Date;

    @Expose()
    updatedAt: Date;

    @Expose()
    @Type(() => UserFindDto)
    sender: UserFindDto;

    @Expose()
    @Type(() => ChatFindDto)
    chat: ChatFindDto;

    @Expose()
    decryptedText: string;

    constructor(message: Message, encryptionService: EncryptionService) {
        this.id = message.id;
        this.decryptedText = encryptionService.decrypt(message.encryptedText);
    }
}