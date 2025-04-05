import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AddUserToChatDto } from '../../modules/chat/dto/add-user-to-chat.dto';
import { ChatService } from '../../modules/chat/chat.service';
import { Chat } from '../../modules/chat/entities/chat.entity';
import { User } from '../../modules/user/entities/user.entity';
import { CreateChatDto } from '../../modules/chat/dto/create-chat.dto';
import { ConfigModule } from '@nestjs/config';

describe('ChatService', () => {
    let chatService: ChatService;

    const mockChatRepository = {
        findOne: jest.fn(),
        save: jest.fn(),
        find: jest.fn(),
        create: jest.fn(),
    };

    const mockUserRepository = {
        findOne: jest.fn(),
        find: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [ConfigModule],
            providers: [
                ChatService,
                {
                    provide: getRepositoryToken(Chat),
                    useValue: mockChatRepository,
                },
                {
                    provide: getRepositoryToken(User),
                    useValue: mockUserRepository,
                },
            ],
        }).compile();

        chatService = module.get<ChatService>(ChatService);
    });

    describe('createChat', () => {
        it('should create a chat successfully', async () => {
            const createChatDto: CreateChatDto = {
                name: 'Test Chat',
                participants: ['test-uuid-1', 'test-uuid-2'],
                isPrivate: false
            };

            const users = <User[]>[{ id: 'test-uuid-3' }, { id: 'test-uuid-4' }];
            const createdById = 'test-uuid-5';
            const newChat: Partial<Chat> = {
                id: 'test-uuid-6',
                ...createChatDto,
                createdBy: <User>{ id: createdById },
                participants: users,
            };

            mockUserRepository.find.mockResolvedValue(users);
            mockChatRepository.create.mockReturnValue(newChat);
            mockChatRepository.save.mockResolvedValue(newChat);

            const result = await chatService.createChat(createChatDto, createdById);

            expect(result.name).toBe('Test Chat');
            expect(result.participants.length).toBe(2);
        });

        it('should throw an error if users are not found', async () => {
            const createChatDto: CreateChatDto = {
                name: 'Test Chat',
                participants: ['test-uuid-1', 'test-uuid-2'],
                isPrivate: false
            };

            const createdById = 'test-uuid-1';

            mockUserRepository.find.mockResolvedValue([{ id: 'test-uuid-1' }]);

            await expect(chatService.createChat(createChatDto, createdById)).rejects.toThrow('One or more users not found');
        });
    });

    describe('getUserChats', () => {
        it('should return all chats for a user', async () => {
            const userId = 'test-uuid-1';
            const chats: Partial<Chat>[] = [
                { id: 'test-uuid-1', name: 'Chat 1', createdBy: <User>{ id: userId } },
                { id: 'test-uuid-2', name: 'Chat 2', participants: [<User>{ id: userId }] },
            ];

            mockChatRepository.find.mockResolvedValue(chats);

            const result = await chatService.getUserChats(userId);

            expect(result).toEqual(chats);
        });
    });

    describe('addUserToChat', () => {
        it('should add a user to a chat', async () => {
            const chatId = 'test-uuid-1';
            const addUserDto: AddUserToChatDto = { userId: 'test-uuid-3' };
            const userId = 'test-uuid-1';
            const existingChat = {
                id: chatId,
                name: 'Test Chat',
                createdBy: { id: userId },
                participants: [{ id: 'test-uuid-1' }],
            };
            const userToAdd = { id: 'test-uuid-3' };

            mockChatRepository.findOne.mockResolvedValue(existingChat);
            mockUserRepository.findOne.mockResolvedValue(userToAdd);
            mockChatRepository.save.mockResolvedValue({
                ...existingChat,
                participants: [...existingChat.participants, userToAdd]
            });

            const result = await chatService.addUserToChat(chatId, addUserDto, userId);

            expect(result.participants).toContainEqual(userToAdd);
        });

        it('should throw an error if the user is already in the chat', async () => {
            const chatId = 'test-uuid-1';
            const addUserDto: AddUserToChatDto = { userId: 'test-uuid-1' };
            const userId = 'test-uuid-1';
            const existingChat = {
                id: chatId,
                name: 'Test Chat',
                createdBy: { id: userId },
                participants: [{ id: 'test-uuid-1' }],
            };

            mockChatRepository.findOne.mockResolvedValue(existingChat);
            mockUserRepository.findOne.mockResolvedValue(<User>{
                id: userId,
            })

            await expect(chatService.addUserToChat(
                chatId,
                addUserDto,
                userId
            )).rejects.toThrow('User is already in the chat');
        });

        it('should throw an error if user is not found', async () => {
            const chatId = 'test-uuid-1';
            const addUserDto: AddUserToChatDto = { userId: 'test-uuid-3' };
            const userId = 'test-uuid-1';

            mockChatRepository.findOne.mockResolvedValue({
                id: chatId,
                createdBy: { id: userId },
                participants: []
            });
            mockUserRepository.findOne.mockResolvedValue(null);

            await expect(chatService.addUserToChat(chatId, addUserDto, userId)).rejects.toThrow('User not found');
        });

        it('should throw an error if chat is not found', async () => {
            const chatId = 'test-uuid-1';
            const addUserDto: AddUserToChatDto = { userId: 'test-uuid-3' };
            const userId = 'test-uuid-1';

            mockChatRepository.findOne.mockResolvedValue(null);

            await expect(chatService.addUserToChat(chatId, addUserDto, userId)).rejects.toThrow('Chat not found');
        });

        it('should throw an error if the user is not the owner of the chat', async () => {
            const chatId = 'test-uuid-1';
            const addUserDto: AddUserToChatDto = { userId: 'test-uuid-3' };
            const userId = 'test-uuid-2';

            const existingChat = {
                id: chatId,
                createdBy: { id: 'test-uuid-1' },
                participants: [],
            };

            mockChatRepository.findOne.mockResolvedValue(existingChat);

            await expect(chatService.addUserToChat(
                chatId,
                addUserDto,
                userId
            )).rejects.toThrow('Only the owner can add users to the chat');
        });
    });

    describe('removeUserFromChat', () => {
        it('should remove a user from a chat', async () => {
            const chatId = 'test-uuid-1';
            const userIdToRemove = 'test-uuid-2';
            const existingChat = {
                id: chatId,
                name: 'Test Chat',
                createdBy: { id: 'test-uuid-1' },
                participants: [{ id: 'test-uuid-1' }, { id: userIdToRemove }],
            };

            mockChatRepository.findOne.mockResolvedValue(existingChat);
            mockChatRepository.save.mockResolvedValue({ ...existingChat, participants: [{ id: 'test-uuid-1' }] });

            const result = await chatService.removeUserFromChat(chatId, userIdToRemove);

            expect(result.participants).not.toContainEqual({ id: userIdToRemove });
        });

        it('should throw an error if chat is not found', async () => {
            const chatId = 'test-uuid-1';
            const userIdToRemove = 'test-uuid-2';

            mockChatRepository.findOne.mockResolvedValue(null);

            await expect(chatService.removeUserFromChat(chatId, userIdToRemove)).rejects.toThrow('Chat not found');
        });

        it('should throw an error if the user is not the owner or part of the chat', async () => {
            const chatId = 'test-uuid-1';
            const userIdToRemove = 'test-uuid-2';

            const existingChat: Partial<Chat> = {
                id: chatId,
                createdBy: <User>{ id: 'test-uuid-1' },
                participants: [<User>{ id: 'test-uuid-1' }],
            };

            mockChatRepository.findOne.mockResolvedValue(existingChat);

            await expect(chatService.removeUserFromChat(
                chatId,
                userIdToRemove
            )).rejects.toThrow('Only the owner or the user themselves can remove the user');
        });
    });
});
