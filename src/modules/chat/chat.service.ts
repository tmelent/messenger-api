import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Chat } from './entities/chat.entity';
import { User } from '../user/entities/user.entity';
import { CreateChatDto } from './dto/create-chat.dto';
import { AddUserToChatDto } from './dto/add-user-to-chat.dto';

@Injectable()
export class ChatService {
    constructor(
        @InjectRepository(Chat)
        private readonly chatRepository: Repository<Chat>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {
    }

    async createChat(createChatDto: CreateChatDto, createdById: string): Promise<Chat> {
        const { name, participants = [] } = createChatDto;

        const users = participants.length > 0
            ? await this.userRepository.find({ where: { id: In(participants) } })
            : [];

        if (users.length !== participants.length) {
            throw new Error('One or more users not found');
        }

        const chat = this.chatRepository.create({
            name,
            isPrivate: createChatDto.isPrivate,
            createdBy: { id: createdById },
            participants: users,
        });

        return this.chatRepository.save(chat);
    }

    async getUserChats(userId: string): Promise<Chat[]> {
        return this.chatRepository.find({
            where: [
                { createdBy: { id: userId } },
                { participants: { id: userId } }
            ],
            relations: {
                createdBy: true,
                participants: true,
            },
        });
    }

    async addUserToChat(chatId: string, addUserDto: AddUserToChatDto, userId: string): Promise<Chat> {
        const chat = await this.chatRepository.findOne({
            where: { id: chatId },
            relations: {
                participants: true,
                createdBy: true,
            },
        });

        if (!chat) {
            throw new Error('Chat not found');
        }

        if (chat.createdBy.id !== userId) {
            throw new Error('Only the owner can add users to the chat');
        }

        const user = await this.userRepository.findOne({
            where: { id: addUserDto.userId },
        });

        if (!user) {
            throw new Error('User not found');
        }

        if (chat.participants.some(u => u.id === user.id)) {
            throw new Error('User is already in the chat');
        }

        chat.participants.push(user);
        return this.chatRepository.save(chat);
    }

    async removeUserFromChat(chatId: string, userId: string): Promise<Chat> {
        const chat = await this.chatRepository.findOne({
            where: { id: chatId },
            relations: {
                participants: true,
                createdBy: true,
            },
        });

        if (!chat) {
            throw new Error('Chat not found');
        }

        if (chat.createdBy.id === userId || chat.participants.some(u => u.id === userId)) {
            chat.participants = chat.participants.filter(user => user.id !== userId);
            return this.chatRepository.save(chat);
        }

        throw new Error('Only the owner or the user themselves can remove the user');
    }
}
