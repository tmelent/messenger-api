import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
import { User } from '../../user/entities/user.entity';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
    constructor(private authService: AuthService) {
        super({
            usernameField: 'usernameOrEmail'
        });
    }

    async validate(usernameOrEmail: string, password: string): Promise<Partial<User>> {
        const user = await this.authService.validateUser(usernameOrEmail, password);

        if (!user) {
            throw new UnauthorizedException();
        }

        return user;
    }
}