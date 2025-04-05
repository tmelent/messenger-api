import { Injectable } from '@nestjs/common';
import { ExtendedError, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WsAuthMiddleware {
    constructor(private readonly jwtService: JwtService,
                private readonly configService: ConfigService) {}

    use(socket: Socket, next: (err?: ExtendedError) => void) {
        const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];

        if (!token) {
            return next(new Error('Authentication error'));
        }

        try {
            socket.data.user = this.jwtService.verify(token, {
                secret: this.configService.get('jwtSecret'),
            });
            next();
        } catch (err) {
            console.error(err);
            next(new Error('Invalid token'));
        }
    }
}
