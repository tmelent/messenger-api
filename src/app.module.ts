import configuration from './modules/config/configuration';
import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { DatabaseModule } from './modules/database/database.module';
import { UserModule } from './modules/user/user.module';
import { CommonModule } from './modules/common/common.module';
import { AuthModule } from './modules/auth/auth.module';
import { ChatModule } from './modules/chat/chat.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            load: [configuration],
            cache: true,
            isGlobal: true,
        }),
        DatabaseModule,
        UserModule,
        CommonModule,
        AuthModule,
        ChatModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule {
}