import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Message } from './entities/message.entity';
import { Repository } from 'typeorm';
import { Chat } from '../chat/entities/chat.entity';
import { User } from '../user/entities/user.entity';
import { EncryptionService } from '../common/encryption.service';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { DeleteMessageDto } from './dto/delete-message.dto';
import { GetMessagesDto } from './dto/get-messages.dto';
import { MessageFindDto } from './dto/message-find.dto';
import { plainToClass } from 'class-transformer';

@Injectable()
export class MessageService {
    constructor(
        @InjectRepository(Message)
        private readonly messageRepository: Repository<Message>,
        @InjectRepository(Chat)
        private readonly chatRepository: Repository<Chat>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private encryptionService: EncryptionService
    ) {}

    async createMessage(createMessageDto: CreateMessageDto, senderId: string): Promise<Message> {
        const chat = await this.chatRepository.findOneBy({
            id: createMessageDto.chatId,
        });

        if (!chat) {
            throw new NotFoundException('Chat not found');
        }

        const user = await this.userRepository.findOneBy({
            id: senderId,
        })

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const encryptedText = await this.encryptionService.encrypt(createMessageDto.text);

        const message = this.messageRepository.create({
            chat,
            sender: user,
            encryptedText,
        });

        return await this.messageRepository.save(message);
    }

    async updateMessage(updateMessageDto: UpdateMessageDto, userId: string): Promise<Message> {
        const user = await this.userRepository.findOneBy({
            id: userId,
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const message = await this.messageRepository.findOne({
            where: {
                id: updateMessageDto.messageId,
            },
            relations: {
                sender: true,
            },
        });

        if (!message || message.deletedAt) {
            throw new NotFoundException('Message not found');
        }

        if (message.sender.id !== userId) {
            throw new ForbiddenException('User has no permission to update this message');
        }

        message.encryptedText = this.encryptionService.encrypt(updateMessageDto.text);

        return await this.messageRepository.save(message);
    }

    async deleteMessage(deleteMessageDto: DeleteMessageDto, userId: string): Promise<Message> {
        const user = await this.userRepository.findOneBy({
            id: userId,
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const message = await this.messageRepository.findOne({
            where: {
                id: deleteMessageDto.messageId
            },
            relations: {
                sender: true,
                chat: {
                    createdBy: true,
                },
            }
        });

        if (!message || message.deletedAt) {
            throw new NotFoundException('Message not found');
        }

        if (message.sender.id !== userId && message.chat.createdBy.id !== userId) {
            throw new ForbiddenException('User has no permission to delete this message');
        }

        return await this.messageRepository.softRemove(message);
    }

    async getChatMessages(getMessagesDto: GetMessagesDto): Promise<MessageFindDto[]> {
        const { page, limit, chatId } = getMessagesDto;
        const skip = (page - 1) * limit;

        const messages = await this.messageRepository.find({
            where: {
                chat: {
                    id: chatId,
                },
            },
            order: {
                createdAt: 'DESC'
            },
            take: limit,
            skip,
            relations: {
                sender: true,
                chat: true,
            },
        });

        return messages.map(message => plainToClass(MessageFindDto, new MessageFindDto(message, this.encryptionService)));
    }
}