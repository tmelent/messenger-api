import "reflect-metadata";
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
    const logger = new Logger('Bootstrap');
    const app = await NestFactory.create(AppModule);

    app.useLogger(logger);

    const configService = app.get(ConfigService);

    const port = configService.get<number>('port') || 4000;

    app.enableCors();

    app.useGlobalPipes(new ValidationPipe({
        transform: true, // Преобразует входящие данные в нужные типы
        whitelist: true, // Отключает свойства, которые не указаны в DTO
        forbidNonWhitelisted: true, // Выдаёт ошибку, если есть лишние поля
    }));

    await app.listen(port);

    logger.log(`Server is running on http://localhost:${port}`);
}

bootstrap();