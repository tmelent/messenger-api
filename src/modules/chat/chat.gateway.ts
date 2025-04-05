import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { AddUserToChatDto } from './dto/add-user-to-chat.dto';
import { WsAuthMiddleware } from '../../middleware/ws-auth.middleware';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
    cors: true,
    namespace: 'chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
    @WebSocketServer()
    server: Server;

    constructor(private readonly chatService: ChatService,
                private readonly configService: ConfigService) {
    }

    afterInit(server: Server) {
        server.use((socket, next) =>
            new WsAuthMiddleware(new JwtService(), this.configService).use(socket, next));
    }

    handleConnection(client: Socket) {
        console.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('createChat')
    async handleCreateChat(
        @MessageBody() data: { chat: CreateChatDto; userId: string },
        @ConnectedSocket() client: Socket,
    ) {
        try {
            const user = client.data.user;

            if (!user) {
                client.emit('error', { success: false, message: 'User not authenticated' });
                return;
            }

            const chat = await this.chatService.createChat(data.chat, data.userId);
            client.emit('chatCreated', { success: true, chat });
        } catch (error) {
            client.emit('error', { success: false, message: (error as Error).message });
        }
    }

    @SubscribeMessage('getUserChats')
    async handleGetUserChats(
        @MessageBody() data: { userId: string },
        @ConnectedSocket() client: Socket
    ) {
        try {
            const user = client.data.user;

            if (!user) {
                client.emit('error', { success: false, message: 'User not authenticated' });
                return;
            }

            const chats = await this.chatService.getUserChats(data.userId);
            client.emit('userChats', { success: true, chats });
        } catch (error) {
            client.emit('error', { success: false, message: (error as Error).message });
        }
    }

    @SubscribeMessage('addUserToChat')
    async handleAddUserToChat(
        @MessageBody() data: { chatId: string; addUserDto: AddUserToChatDto; userId: string },
        @ConnectedSocket() client: Socket
    ) {
        try {
            const user = client.data.user;

            if (!user) {
                client.emit('error', { success: false, message: 'User not authenticated' });
                return;
            }

            const updatedChat = await this.chatService.addUserToChat(data.chatId, data.addUserDto, data.userId);
            this.server.to(`chat_${data.chatId}`).emit('userAdded', { success: true, updatedChat });
        } catch (error) {
            client.emit('error', { success: false, message: (error as Error).message });
        }
    }

    @SubscribeMessage('removeUserFromChat')
    async handleRemoveUserFromChat(
        @MessageBody() data: { chatId: string; userId: string },
        @ConnectedSocket() client: Socket
    ) {
        try {
            const user = client.data.user;

            if (!user) {
                client.emit('error', { success: false, message: 'User not authenticated' });
                return;
            }

            const updatedChat = await this.chatService.removeUserFromChat(data.chatId, data.userId);
            this.server.to(`chat_${data.chatId}`).emit('userRemoved', { success: true, updatedChat });
        } catch (error) {
            client.emit('error', { success: false, message: (error as Error).message });
        }
    }
}