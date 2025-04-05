import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from '../../modules/chat/chat.service';
import { ChatController } from '../../modules/chat/chat.controller';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { CreateChatDto } from '../../modules/chat/dto/create-chat.dto';
import { AddUserToChatDto } from '../../modules/chat/dto/add-user-to-chat.dto';
import { Chat } from '../../modules/chat/entities/chat.entity';
import { User } from '../../modules/user/entities/user.entity';
import { Request } from 'express';
import { ConfigModule } from '@nestjs/config';

describe('ChatController', () => {
    let chatController: ChatController;
    let chatService: ChatService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [ConfigModule],
            controllers: [ChatController],
            providers: [
                {
                    provide: ChatService,
                    useValue: {
                        createChat: jest.fn(),
                        getUserChats: jest.fn(),
                        addUserToChat: jest.fn(),
                        removeUserFromChat: jest.fn(),
                    },
                },
            ],
        })
            .overrideGuard(JwtAuthGuard)
            .useValue({
                canActivate: jest.fn(() => true),
            })
            .compile();

        chatService = module.get<ChatService>(ChatService);
        chatController = module.get<ChatController>(ChatController);
    });

    it('should be defined', () => {
        expect(chatController).toBeDefined();
    });

    describe('createChat', () => {
        it('should create a chat', async () => {
            const createChatDto: CreateChatDto = { name: 'Test Chat', isPrivate: false };
            const chat = { id: 'test-uuid-1', name: 'Test Chat' };

            jest.spyOn(chatService, 'createChat').mockResolvedValue(chat as Chat);

            const result = await chatController.createChat(createChatDto, {
                user: {
                    id: 'test-uuid-1'
                }
            } as unknown as Request);
            expect(result.name).toBe('Test Chat');
            expect(result.id).toBeDefined();
        });
    });

    describe('getUserChats', () => {
        it('should get user chats', async () => {
            const userId = 'test-uuid-1';
            const chats: Chat[] = [
                <Chat>{ id: 'test-uuid-1', name: 'Test Chat 1', createdBy: <User>{ id: userId } },
                <Chat>{ id: 'test-uuid-2', name: 'Test Chat 2', createdBy: <User>{id: userId } },
            ];

            jest.spyOn(chatService, 'getUserChats').mockResolvedValue(chats);

            const result = await chatController.getUserChats(userId);
            expect(result).toEqual(chats);
        });
    });

    describe('addUserToChat', () => {
        it('should add user to chat', async () => {
            const addUserDto: AddUserToChatDto = { userId: 'test-uuid-2' };

            const updatedChat = <Chat>{ id: 'test-uuid', name: 'Test Chat', participants: [{ id: 'test-uuid-2' }] };
            jest.spyOn(chatService, 'addUserToChat').mockResolvedValue(updatedChat);

            const result = await chatController.addUserToChat('test-uuid-1', addUserDto, 'test-uuid-1');
            expect(result.participants).toContainEqual(expect.objectContaining({ id: 'test-uuid-2' }));
        });
    });

    describe('removeUserFromChat', () => {
        it('should remove user from chat', async () => {
            const updatedChat = {
                id: 'test-uuid',
                name: 'Test Chat',
                participants: [] as User[],
                createdBy: <User>{ id: 'test-uuid-1' }
            } as Chat;

            jest.spyOn(chatService, 'removeUserFromChat').mockResolvedValue(updatedChat as Chat);

            const result = await chatController.removeUserFromChat('test-uuid-1', 'test-uuid-2');
            expect(result.participants).not.toContainEqual(expect.objectContaining({ id: 'test-uuid-2' }));
        });
    });
});
