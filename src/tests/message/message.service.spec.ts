import { MessageService } from '../../modules/messages/message.service';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Chat } from '../../modules/chat/entities/chat.entity';
import { User } from '../../modules/user/entities/user.entity';
import { Message } from '../../modules/messages/entities/message.entity';
import { CreateMessageDto } from '../../modules/messages/dto/create-message.dto';
import { EncryptionService } from '../../modules/common/encryption.service';
import { ConfigModule } from '@nestjs/config';
import configuration from '../../modules/config/configuration';
import { UpdateMessageDto } from '../../modules/messages/dto/update-message.dto';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { DeleteMessageDto } from '../../modules/messages/dto/delete-message.dto';
import { GetMessagesDto } from '../../modules/messages/dto/get-messages.dto';

// TODO: fix cases
describe.skip('MessageService', () => {
    let messageService: MessageService;
    let encryptionService: EncryptionService;

    const mockChatRepository = {
        findOne: jest.fn(),
        findOneBy: jest.fn(),
    }

    const mockUserRepository = {
        findOneBy: jest.fn(),
    }

    const mockMessageRepository = {
        findOne: jest.fn(),
        find: jest.fn(),
        softRemove: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
    }

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MessageService,
                {
                    provide: getRepositoryToken(Chat),
                    useValue: mockChatRepository,
                },
                {
                    provide: getRepositoryToken(User),
                    useValue: mockUserRepository,
                },
                {
                    provide: getRepositoryToken(Message),
                    useValue: mockMessageRepository,
                },
                EncryptionService,
            ],
            imports: [ConfigModule.forRoot({
                load: [configuration],
            })],
        }).compile();

        messageService = module.get<MessageService>(MessageService);
        encryptionService = module.get<EncryptionService>(EncryptionService);
    });

    it('should be defined', () => {
        expect(messageService).toBeDefined();
    });

    describe('createMessage', () => {
        it('Should create message with an encrypted text', async () => {
            const senderId = 'test-uuid-1';

            const createMessageDto: CreateMessageDto = {
                chatId: 'test-uuid-1',
                text: 'test message',
            };

            const chat: Chat = {
                id: 'test-uuid-1',
                name: 'Test Chat',
                createdBy: <User>{
                    id: 'test-uuid-1',
                },
                isPrivate: false,
                participants: [<User>{ id: 'test-uuid-1'}],
                deletedAt: null,
                createdAt: new Date(),
            };

            const user: User = {
                id: 'test-uuid-1',
                password: '',
                username: '',
                createdAt: new Date(),
                deletedAt: null,
                blocked: false,
                email: '',
                chats: [chat],
            };

            const encryptedTextVersion = encryptionService.encrypt(createMessageDto.text);

            const message: Message = {
                id: 'test-uuid-1',
                createdAt: new Date(),
                deletedAt: null,
                updatedAt: new Date(),
                encryptedText: encryptedTextVersion,
                sender: <User>{
                    id: senderId,
                },
                chat,
            }

            mockChatRepository.findOneBy.mockResolvedValue(chat);
            mockUserRepository.findOneBy.mockResolvedValue(user);
            mockMessageRepository.create.mockResolvedValue(message);
            mockMessageRepository.save.mockResolvedValue(message);

            const result = await messageService.createMessage(createMessageDto, senderId);

            expect(result.encryptedText).toBe(encryptedTextVersion);
            expect(mockMessageRepository.create).toHaveBeenCalledWith({
                chat,
                sender: user,
                encryptedText: encryptedTextVersion,
            });
        });
    });

    describe('updateMessage', () => {
        it('Should update message with an encrypted text', async () => {
            const senderId = 'test-uuid-1';

            const updateMessageDto: UpdateMessageDto = {
                messageId: 'test-uuid-1',
                text: 'test message',
            };

            const chat: Chat = {
                id: 'test-uuid-1',
                name: 'Test Chat',
                createdBy: <User>{
                    id: 'test-uuid-1',
                },
                isPrivate: false,
                participants: [<User>{ id: 'test-uuid-1'}],
                deletedAt: null,
                createdAt: new Date(),
            };

            const user: User = {
                id: 'test-uuid-1',
                password: '',
                username: '',
                createdAt: new Date(),
                deletedAt: null,
                blocked: false,
                email: '',
                chats: [chat],
            };

            const encryptedTextVersion = encryptionService.encrypt(updateMessageDto.text);

            const message: Message = {
                id: 'test-uuid-1',
                createdAt: new Date(),
                deletedAt: null,
                updatedAt: new Date(),
                encryptedText: encryptedTextVersion,
                sender: <User>{
                    id: senderId,
                },
                chat,
            }

            mockChatRepository.findOneBy.mockResolvedValue(chat);
            mockUserRepository.findOneBy.mockResolvedValue(user);
            mockMessageRepository.findOne.mockResolvedValue({
                ...message,
                encryptedText: 'random_encrypted_string',
            });
            mockMessageRepository.save.mockResolvedValue(message);

            const result = await messageService.updateMessage(updateMessageDto, senderId);

            expect(result.encryptedText).toBe(encryptedTextVersion);
            expect(mockMessageRepository.save).toHaveBeenCalledWith({
                ...message,
                encryptedText: encryptedTextVersion,
            });
        });

        it('Should not allow update by another user', async () => {
            const senderId = 'test-uuid-2';

            const updateMessageDto: UpdateMessageDto = {
                messageId: 'test-uuid-1',
                text: 'test message',
            };

            const chat: Chat = {
                id: 'test-uuid-1',
                name: 'Test Chat',
                createdBy: <User>{
                    id: 'test-uuid-1',
                },
                isPrivate: false,
                participants: [<User>{ id: 'test-uuid-1'}],
                deletedAt: null,
                createdAt: new Date(),
            };

            const user: User = {
                id: 'test-uuid-2',
                password: '',
                username: '',
                createdAt: new Date(),
                deletedAt: null,
                blocked: false,
                email: '',
                chats: [chat],
            };

            mockChatRepository.findOneBy.mockResolvedValue(chat);
            mockUserRepository.findOneBy.mockResolvedValue(user);

            await expect(messageService.updateMessage(updateMessageDto, senderId)).rejects.toThrow(
                new ForbiddenException('User has no permission to update this message')
            )
        });

        it('Should throw an error if message not found', async () => {
            const senderId = 'test-uuid-2';

            const updateMessageDto: UpdateMessageDto = {
                messageId: 'test-uuid-1',
                text: 'test message',
            };

            const user: User = {
                id: 'test-uuid-2',
                password: '',
                username: '',
                createdAt: new Date(),
                deletedAt: null,
                blocked: false,
                email: '',
                chats: [],
            };

            mockUserRepository.findOneBy.mockResolvedValue(user);
            mockMessageRepository.findOne.mockResolvedValue(null);

            await expect(messageService.updateMessage(updateMessageDto, senderId)).rejects.toThrow(
                new NotFoundException('Message not found'),
            )
        });

        it('Should throw an error if user not found', async () => {
            const senderId = 'test-uuid-2';

            const updateMessageDto: UpdateMessageDto = {
                messageId: 'test-uuid-1',
                text: 'test message',
            };

            mockUserRepository.findOneBy.mockResolvedValue(null);

            await expect(messageService.updateMessage(updateMessageDto, senderId)).rejects.toThrow(
                new NotFoundException('User not found'),
            )
        });
    })

    describe('deleteMessage', () => {
        it('Should delete message successfully if user is author', async () => {
            const senderId = 'test-uuid-1';

            const chat: Chat = {
                id: 'test-uuid-1',
                name: 'Test Chat',
                createdBy: <User>{
                    id: 'test-uuid-3',
                },
                isPrivate: false,
                participants: [<User>{ id: 'test-uuid-1'}, <User>{ id: 'test-uuid-2' }, <User>{ id: 'test-uuid-3' }],
                deletedAt: null,
                createdAt: new Date(),
            }

            const user: User = {
                id: 'test-uuid-1',
                password: '',
                username: '',
                createdAt: new Date(),
                deletedAt: null,
                blocked: false,
                email: '',
                chats: [],
            };

            const message: Message = {
                id: 'test-uuid-1',
                encryptedText: 'random_encrypted_string',
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
                sender: <User>{
                    id: 'test-uuid-1',
                },
                chat,
            };

            const deleteMessageDto: DeleteMessageDto = {
                messageId: message.id,
            };

            mockMessageRepository.findOne.mockResolvedValue(message);
            mockUserRepository.findOneBy.mockResolvedValue(user);
            mockChatRepository.findOneBy.mockResolvedValue(chat);
            mockMessageRepository.softRemove.mockResolvedValue({
                ...message,
                deletedAt: new Date(),
            });

            const result = await messageService.deleteMessage(deleteMessageDto, senderId);
            expect(result.deletedAt).not.toBeNull();
        });

        it('Should delete message successfully if user is creator of chat', async () => {
            const senderId = 'test-uuid-3';

            const chat: Chat = {
                id: 'test-uuid-1',
                name: 'Test Chat',
                createdBy: <User>{
                    id: 'test-uuid-3',
                },
                isPrivate: false,
                participants: [<User>{ id: 'test-uuid-1'}, <User>{ id: 'test-uuid-2' }, <User>{ id: 'test-uuid-3' }],
                deletedAt: null,
                createdAt: new Date(),
            }

            const user: User = {
                id: 'test-uuid-3',
                password: '',
                username: '',
                createdAt: new Date(),
                deletedAt: null,
                blocked: false,
                email: '',
                chats: [],
            };

            const message: Message = {
                id: 'test-uuid-1',
                encryptedText: 'random_encrypted_string',
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
                sender: <User>{
                    id: 'test-uuid-1',
                },
                chat,
            };

            const deleteMessageDto: DeleteMessageDto = {
                messageId: message.id,
            };

            mockMessageRepository.findOne.mockResolvedValue(message);
            mockUserRepository.findOneBy.mockResolvedValue(user);
            mockChatRepository.findOneBy.mockResolvedValue(chat);
            mockMessageRepository.softRemove.mockResolvedValue({
                ...message,
                deletedAt: new Date(),
            });

            const result = await messageService.deleteMessage(deleteMessageDto, senderId);
            expect(result.deletedAt).not.toBeNull();
        });

        it('Should not allow delete message if user is not author or chat creator', async () => {
            const senderId = 'test-uuid-3';

            const chat: Chat = {
                id: 'test-uuid-1',
                name: 'Test Chat',
                createdBy: <User>{
                    id: 'test-uuid-1',
                },
                isPrivate: false,
                participants: [<User>{ id: 'test-uuid-1'}, <User>{ id: 'test-uuid-2' }, <User>{ id: 'test-uuid-3' }],
                deletedAt: null,
                createdAt: new Date(),
            }

            const user: User = {
                id: 'test-uuid-3',
                password: '',
                username: '',
                createdAt: new Date(),
                deletedAt: null,
                blocked: false,
                email: '',
                chats: [],
            };

            const message: Message = {
                id: 'test-uuid-1',
                encryptedText: 'random_encrypted_string',
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
                sender: <User>{
                    id: 'test-uuid-1',
                },
                chat,
            };

            const deleteMessageDto: DeleteMessageDto = {
                messageId: message.id,
            };

            mockMessageRepository.findOne.mockResolvedValue(message);
            mockUserRepository.findOneBy.mockResolvedValue(user);
            mockChatRepository.findOneBy.mockResolvedValue(chat);

            await expect(messageService.deleteMessage(deleteMessageDto, senderId)).rejects.toThrow(
                new ForbiddenException('User has no permission to delete this message')
            )
        })

        it('Should throw an error if user is not found', async () => {
            const senderId = 'test-uuid-3';
            const deleteMessageDto: DeleteMessageDto = {
                messageId: 'test-uuid-1',
            };

            mockUserRepository.findOneBy.mockResolvedValue(null);

            await expect(messageService.deleteMessage(deleteMessageDto, senderId)).rejects.toThrow(
                new NotFoundException('User not found')
            )
        })

        it('Should throw an error if message is not found', async () => {
            const senderId = 'test-uuid-1';
            const deleteMessageDto: DeleteMessageDto = {
                messageId: 'test-uuid-1',
            };

            const user: User = {
                id: 'test-uuid-1',
                password: '',
                username: '',
                createdAt: new Date(),
                deletedAt: null,
                blocked: false,
                email: '',
                chats: [],
            };

            mockUserRepository.findOneBy.mockResolvedValue(user);
            mockMessageRepository.findOne.mockResolvedValue(null);

            await expect(messageService.deleteMessage(deleteMessageDto, senderId)).rejects.toThrow(
                new NotFoundException('Message not found')
            )
        })
    })

    describe('getMessages', () => {
        it('should return an array of messages', async () => {
            const chatId = 'test-uuid-1';
            const dto: GetMessagesDto = { page: 1, limit: 10, chatId };
            const messages: Message[] = [
                <Message>{
                id: 'test-uuid-1',
                    encryptedText: 'Hello',
                    createdAt: new Date(),
                    sender: new User(),
                    chat: new Chat()
                },
                <Message>{
                id: 'test-uuid-2',
                    encryptedText: 'Hi',
                    createdAt: new Date(),
                    sender: new User(),
                    chat: new Chat()
                },
            ];

            mockMessageRepository.find.mockResolvedValue(messages);

            const result = await messageService.getChatMessages(dto);
            expect(result).toEqual(messages);
            expect(mockMessageRepository.find).toHaveBeenCalledWith({
                where: { chat: { id: chatId } },
                order: { createdAt: 'DESC' },
                take: dto.limit,
                skip: (dto.page - 1) * dto.limit,
                relations: { sender: true, chat: true },
            });
        });

        it('should return an empty array if no messages are found', async () => {
            mockMessageRepository.find.mockResolvedValue([]);

            const result = await messageService.getChatMessages({ page: 1, limit: 10, chatId: 'test-uuid-99' });
            expect(result).toEqual([]);
        });
    })
})
