import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

@Injectable()
export class HashService {

    constructor() {
    }

    async hashPassword(password: string): Promise<string> {
        return argon2.hash(password);
    }

    async comparePassword({ password, hash }: {
        password: string;
        hash: string;
    }): Promise<boolean> {
        return argon2.verify(hash, password);
    }
}