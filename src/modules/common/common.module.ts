import { Module } from '@nestjs/common';
import { HashService } from './hash.service';
import { EncryptionService } from './encryption.service';

@Module({
    imports: [],
    providers: [HashService, EncryptionService],
    exports: [HashService, EncryptionService],
})
export class CommonModule {
}