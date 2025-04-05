import { MessageGateway } from '../../modules/messages/message.gateway';
import { MessageService } from '../../modules/messages/message.service';
import { Socket } from 'socket.io';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { GetMessagesDto } from '../../modules/messages/dto/get-messages.dto';
import { CreateMessageDto } from '../../modules/messages/dto/create-message.dto';
import { UpdateMessageDto } from '../../modules/messages/dto/update-message.dto';
import { DeleteMessageDto } from '../../modules/messages/dto/delete-message.dto';
import { ConfigModule } from '@nestjs/config';

// TODO: fix cases

describe.skip('MessageGateway', () => {
    let gateway: MessageGateway;
    let socket: Socket;

    const mockMessageService = {
        getChatMessages: jest.fn(),
        createMessage: jest.fn(),
        updateMessage: jest.fn(),
        deleteMessage: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [ConfigModule],
            providers: [
                MessageGateway,
                {
                    provide: MessageService,
                    useValue: mockMessageService,
                },
                JwtService,
            ],
        }).compile();

        gateway = module.get<MessageGateway>(MessageGateway);

        socket = {
            id: 'mock_socket',
            emit: jest.fn(),
            data: { user: { sub: 'user-1' } },
        } as unknown as Socket;
    });

    describe('handleConnection', () => {
        it('should log connection message', () => {
            const consoleSpy = jest.spyOn(console, 'log');
            gateway.handleConnection(socket);
            expect(consoleSpy).toHaveBeenCalledWith(`Client connected: ${socket.id}`);
        });
    });

    describe('handleDisconnect', () => {
        it('should log disconnection message', () => {
            const consoleSpy = jest.spyOn(console, 'log');
            gateway.handleDisconnect(socket);
            expect(consoleSpy).toHaveBeenCalledWith(`Client disconnected: ${socket.id}`);
        });
    });

    describe('handleGetMessages', () => {
        it('should get messages for authenticated user', async () => {
            const data: GetMessagesDto = { chatId: 'chat-1', page: 1, limit: 10 };
            const messages = [{ id: 'msg-1', encryptedText: 'Hello' }];
            mockMessageService.getChatMessages.mockResolvedValue(messages);

            await gateway.handleGetMessages(data, socket);

            expect(mockMessageService.getChatMessages).toHaveBeenCalledWith(data);
            expect(socket.emit).toHaveBeenCalledWith('messages', { success: true, messages });
        });

        it('should emit error if user is not authenticated', async () => {
            socket.data.user = null;
            const data: GetMessagesDto = { chatId: 'chat-1', page: 1, limit: 10 };

            await gateway.handleGetMessages(data, socket);

            expect(socket.emit).toHaveBeenCalledWith('error', { success: false, message: 'User not authenticated' });
        });
    });

    describe('handleCreateMessage', () => {
        it('should create a new message for authenticated user', async () => {
            const data: CreateMessageDto = { chatId: 'chat-1', text: 'New message' };
            const createdMessage = { id: 'msg-1', text: 'New message' };
            mockMessageService.createMessage.mockResolvedValue(createdMessage);

            await gateway.handleCreateMessage(data, socket);

            expect(mockMessageService.createMessage).toHaveBeenCalledWith(data, 'user-1');
            expect(socket.emit).toHaveBeenCalledWith('messageCreated', { success: true, createdMessage });
        });

        it('should emit error if user is not authenticated', async () => {
            socket.data.user = null;
            const data: CreateMessageDto = { chatId: 'chat-1', text: 'New message' };

            await gateway.handleCreateMessage(data, socket);

            expect(socket.emit).toHaveBeenCalledWith('error', { success: false, message: 'User not authenticated' });
        });
    });

    describe('handleUpdateMessage', () => {
        it('should update a message for authenticated user', async () => {
            const data: UpdateMessageDto = { messageId: 'msg-1', text: 'Updated message' };
            const updatedMessage = { id: 'msg-1', text: 'Updated message' };
            mockMessageService.updateMessage.mockResolvedValue(updatedMessage);

            await gateway.handleUpdateMessage(data, socket);

            expect(mockMessageService.updateMessage).toHaveBeenCalledWith(data, 'user-1');
            expect(socket.emit).toHaveBeenCalledWith('messageUpdated', { success: true, updatedMessage });
        });

        it('should emit error if user is not authenticated', async () => {
            socket.data.user = null;
            const data: UpdateMessageDto = { messageId: 'msg-1', text: 'Updated message' };

            await gateway.handleUpdateMessage(data, socket);

            expect(socket.emit).toHaveBeenCalledWith('error', { success: false, message: 'User not authenticated' });
        });
    });

    describe('handleDeleteMessage', () => {
        it('should delete a message for authenticated user', async () => {
            const data: DeleteMessageDto = { messageId: 'msg-1' };
            mockMessageService.deleteMessage.mockResolvedValue(undefined);

            await gateway.handleDeleteMessage(data, socket);

            expect(mockMessageService.deleteMessage).toHaveBeenCalledWith(data, 'user-1');
            expect(socket.emit).toHaveBeenCalledWith('messageDeleted', { success: true, deletedMessage: { id: 'msg-1' } });
        });

        it('should emit error if user is not authenticated', async () => {
            socket.data.user = null;
            const data: DeleteMessageDto = { messageId: 'msg-1' };

            await gateway.handleDeleteMessage(data, socket);

            expect(socket.emit).toHaveBeenCalledWith('error', { success: false, message: 'User not authenticated' });
        });
    });
});
