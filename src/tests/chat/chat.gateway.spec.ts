import { Test, TestingModule } from '@nestjs/testing';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from '../../modules/chat/chat.service';
import { ChatGateway } from '../../modules/chat/chat.gateway';
import { AddUserToChatDto } from '../../modules/chat/dto/add-user-to-chat.dto';
import { CreateChatDto } from '../../modules/chat/dto/create-chat.dto';
import { ConfigModule } from '@nestjs/config';

describe('ChatGateway', () => {
    let gateway: ChatGateway;
    let chatService: ChatService;
    let socket: Socket;
    let server: Server;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [ConfigModule],
            providers: [
                ChatGateway,
                {
                    provide: ChatService,
                    useValue: {
                        createChat: jest.fn(),
                        getUserChats: jest.fn(),
                        addUserToChat: jest.fn(),
                        removeUserFromChat: jest.fn(),
                    },
                },
                JwtService,
            ],
        }).compile();

        gateway = module.get<ChatGateway>(ChatGateway);
        chatService = module.get<ChatService>(ChatService);
        server = {
            to: jest.fn().mockReturnThis(),
            emit: jest.fn(),
        } as unknown as Server;

        socket = {
            id: 'mocked-id',
            emit: jest.fn(),
            data: { user: { sub: 'user-1' } },
        } as unknown as Socket;

        gateway.server = server;
    });

    describe('handleCreateChat', () => {
        it('should create a new chat and emit "chatCreated" event', async () => {
            const chatDto: CreateChatDto = { name: 'Test Chat', isPrivate: false };
            const userId = 'user-1';
            const chat = { id: 'chat-1', name: 'Test Chat' };

            chatService.createChat = jest.fn().mockResolvedValue(chat);

            const data = { chat: chatDto, userId };

            await gateway.handleCreateChat(data, socket);

            expect(chatService.createChat).toHaveBeenCalledWith(chatDto, userId);
            expect(socket.emit).toHaveBeenCalledWith('chatCreated', { success: true, chat });
        });

        it('should handle error if user is not authenticated', async () => {
            socket.data.user = null;

            const chatDto: CreateChatDto = {
                name: 'Test Chat',
                isPrivate: false,
            };

            const userId = 'user-1';
            const data = { chat: chatDto, userId };

            await gateway.handleCreateChat(data, socket);

            expect(socket.emit).toHaveBeenCalledWith('error', {
                success: false,
                message: 'User not authenticated',
            });
        });
    });

    describe('handleGetUserChats', () => {
        it('should return user chats', async () => {
            const chats = [{ id: 'chat-1', name: 'Test Chat' }];
            chatService.getUserChats = jest.fn().mockResolvedValue(chats);

            const data = { userId: 'user-1' };

            await gateway.handleGetUserChats(data, socket);

            expect(chatService.getUserChats).toHaveBeenCalledWith(data.userId);
            expect(socket.emit).toHaveBeenCalledWith('userChats', { success: true, chats });
        });

        it('should handle error if user is not authenticated', async () => {
            socket.data.user = null;

            const data = { userId: 'user-1' };

            await gateway.handleGetUserChats(data, socket);

            expect(socket.emit).toHaveBeenCalledWith('error', {
                success: false,
                message: 'User not authenticated',
            });
        });
    });

    describe('handleAddUserToChat', () => {
        it('should add user to chat and emit "userAdded" event', async () => {
            const addUserDto: AddUserToChatDto = { userId: 'user-2' };
            const chatId = 'chat-1';
            const userId = 'user-1';
            const updatedChat = { id: 'chat-1', name: 'Test Chat', users: [{ id: 'user-1' }, { id: 'user-2' }] };

            chatService.addUserToChat = jest.fn().mockResolvedValue(updatedChat);

            const data = { chatId, addUserDto, userId };

            await gateway.handleAddUserToChat(data, socket);

            expect(chatService.addUserToChat).toHaveBeenCalledWith(chatId, addUserDto, userId);
            expect(server.to).toHaveBeenCalledWith('chat_' + chatId);
            expect(server.to('').emit).toHaveBeenCalledWith('userAdded', { success: true, updatedChat });
        });

        it('should handle error if user is not authenticated', async () => {
            socket.data.user = null;

            const addUserDto: AddUserToChatDto = { userId: 'user-2' };
            const chatId = 'chat-1';
            const userId = 'user-1';
            const data = { chatId, addUserDto, userId };

            await gateway.handleAddUserToChat(data, socket);

            expect(socket.emit).toHaveBeenCalledWith('error', {
                success: false,
                message: 'User not authenticated',
            });
        });
    });

    describe('handleRemoveUserFromChat', () => {
        it('should remove user from chat and emit "userRemoved" event', async () => {
            const chatId = 'chat-1';
            const userId = 'user-1';
            const updatedChat = { id: 'chat-1', name: 'Test Chat', users: [{ id: 'user-1' }] };

            chatService.removeUserFromChat = jest.fn().mockResolvedValue(updatedChat);

            const data = { chatId, userId };

            await gateway.handleRemoveUserFromChat(data, socket);

            expect(chatService.removeUserFromChat).toHaveBeenCalledWith(chatId, userId);
            expect(server.to).toHaveBeenCalledWith('chat_' + chatId);
            expect(server.to('').emit).toHaveBeenCalledWith('userRemoved', { success: true, updatedChat });
        });

        it('should handle error if user is not authenticated', async () => {
            socket.data.user = null;

            const data = {
                chatId: 'test-uuid-1',
                userId: 'test-uuid-2',
            };

            await gateway.handleRemoveUserFromChat(data, socket);

            expect(socket.emit).toHaveBeenCalledWith('error', {
                success: false,
                message: 'User not authenticated',
            });
        });
    });
});
