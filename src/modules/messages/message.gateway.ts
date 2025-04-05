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
import { WsAuthMiddleware } from '../../middleware/ws-auth.middleware';
import { JwtService } from '@nestjs/jwt';
import { MessageService } from './message.service';
import { GetMessagesDto } from './dto/get-messages.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtPayloadInterface } from '../auth/types/jwt-payload.interface';
import { UpdateMessageDto } from './dto/update-message.dto';
import { DeleteMessageDto } from './dto/delete-message.dto';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
    cors: true,
    namespace: 'messages',
})
export class MessageGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
    @WebSocketServer()
    server: Server;

    constructor(private readonly messageService: MessageService,
                private readonly configService: ConfigService) {
    }

    handleConnection(client: Socket) {
        console.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);
    }

    afterInit(server: Server) {
        server.use((socket, next) =>
            new WsAuthMiddleware(new JwtService(), this.configService).use(socket, next));
    }

    @SubscribeMessage('getMessages')
    async handleGetMessages(
        @MessageBody() data: GetMessagesDto,
        @ConnectedSocket() client: Socket,
    ) {
        try {
            const user = client.data.user;

            if (!user) {
                client.emit('error', { success: false, message: 'User not authenticated' });
                return;
            }

            const messages = await this.messageService.getChatMessages(data);

            client.emit('messages', { success: true, messages });
        } catch (error) {
            client.emit('error', { success: false, message: (error as Error).message });
        }
    }

    @SubscribeMessage('createMessage')
    async handleCreateMessage(
        @MessageBody() data: CreateMessageDto,
        @ConnectedSocket() client: Socket,
    ) {
        try {
            const user: JwtPayloadInterface = client.data.user;

            if (!user) {
                client.emit('error', { success: false, message: 'User not authenticated' });
                return;
            }

            const createdMessage = await this.messageService.createMessage(data, user.sub)

            client.emit('messageCreated', { success: true, createdMessage });
        } catch (error) {
            client.emit('error', { success: false, message: (error as Error).message });
        }
    }

    @SubscribeMessage('updateMessage')
    async handleUpdateMessage(
        @MessageBody() data: UpdateMessageDto,
        @ConnectedSocket() client: Socket,
    ) {
        try {
            const user: JwtPayloadInterface = client.data.user;

            if (!user) {
                client.emit('error', { success: false, message: 'User not authenticated' });
                return;
            }

            const updatedMessage = await this.messageService.updateMessage(data, user.sub)

            client.emit('messageUpdated', { success: true, updatedMessage });
        } catch (error) {
            client.emit('error', { success: false, message: (error as Error).message });
        }
    }

    @SubscribeMessage('deleteMessage')
    async handleDeleteMessage(
        @MessageBody() data: DeleteMessageDto,
        @ConnectedSocket() client: Socket,
    ) {
        try {
            const user: JwtPayloadInterface = client.data.user;

            if (!user) {
                client.emit('error', { success: false, message: 'User not authenticated' });
                return;
            }

            await this.messageService.deleteMessage(data, user.sub);

            client.emit('messageDeleted', {
                success: true,
                deletedMessage: {
                    id: data.messageId,
                }
            });
        } catch (error) {
            client.emit('error', { success: false, message: (error as Error).message });
        }
    }
}