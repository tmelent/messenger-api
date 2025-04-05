import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';
import { MessageService } from './message.service';
import { User } from '../user/entities/user.entity';
import { Chat } from '../chat/entities/chat.entity';
import { MessageGateway } from './message.gateway';
import { CommonModule } from '../common/common.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Message, User, Chat]),
        CommonModule,
    ],
    exports: [MessageService],
    providers: [MessageService, MessageGateway],
    controllers: [],
})
export class MessageModule {}