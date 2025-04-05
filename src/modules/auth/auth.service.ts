import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { User } from '../user/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { HashService } from '../common/hash.service';

@Injectable()
export class AuthService {
    constructor(
        private userService: UserService,
        private jwtService: JwtService,
        private hashService: HashService,
    ) {
    }

    async validateUser(usernameOrEmail: string, password: string) {
        const user = await this.userService.findOneByEmailOrUsername({
            [usernameOrEmail.includes('@') ? 'email' : 'username']: usernameOrEmail,
        } as ({ email: string;} | { username: string;}));

        if (user) {
            const isValidPassword = await this.hashService.comparePassword({
                password,
                hash: user.password,
            });

            if (isValidPassword) {
                return {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    blocked: user.blocked,
                };
            }
        }

        return null;
    }

    async login(user: User) {
        const payload = { username: user.username, email: user.email, sub: user.id };

        return {
            access_token: this.jwtService.sign(payload),
        };
    }
}