import crypto from 'crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EncryptionService {
    private readonly key: Buffer;
    private readonly iv: Buffer;
    private readonly algorithm = 'aes-256-cbc';

    constructor(private readonly configService: ConfigService) {
        this.key = Buffer.from(configService.get<string>('encryption.key') || '1234567890abcdef1234567890abcdef', 'hex');
        this.iv = Buffer.from(configService.get<string>('encryption.iv') || '1234567890abcdef1234567890abcdef', 'hex');
    }

    encrypt(text: string): string {
        const cipher = crypto.createCipheriv(this.algorithm, this.key, this.iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return encrypted;
    }

    decrypt(encryptedText: string): string {
        console.log(encryptedText, this.key, this.iv)
        const decipher = crypto.createDecipheriv(this.algorithm, this.key, this.iv);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
}
