import { Body, Controller, Delete, Get, Param, Post, Request as Req, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { AddUserToChatDto } from './dto/add-user-to-chat.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { plainToClass } from 'class-transformer';
import { ChatFindDto } from './dto/chat-find.dto';

@Controller('chats')
export class ChatController {
    constructor(private readonly chatService: ChatService) {}

    @Post()
    @UseGuards(JwtAuthGuard)
    async createChat(
        @Body() createChatDto: CreateChatDto,
        @Req() req: Request,
    ) {
        const response = await this.chatService.createChat(createChatDto, req.user!.id);
        return plainToClass(ChatFindDto, response);
    }

    @Get(':userId')
    @UseGuards(JwtAuthGuard)
    async getUserChats(@Param('userId') userId: string) {
        return this.chatService.getUserChats(userId);
    }

    @Post(':chatId/users')
    @UseGuards(JwtAuthGuard)
    async addUserToChat(
        @Param('chatId') chatId: string,
        @Body() addUserDto: AddUserToChatDto,
        @Param('userId') userId: string,
    ) {
        return this.chatService.addUserToChat(chatId, addUserDto, userId);
    }

    @Delete(':chatId/users/:userId')
    @UseGuards(JwtAuthGuard)
    async removeUserFromChat(
        @Param('chatId') chatId: string,
        @Param('userId') userId: string,
    ) {
        return this.chatService.removeUserFromChat(chatId, userId);
    }
}
