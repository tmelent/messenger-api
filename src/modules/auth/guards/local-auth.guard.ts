import { AuthGuard } from '@nestjs/passport';
import { BadRequestException, ExecutionContext, Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { LoginDto } from '../dto/login.dto';
import { validate } from 'class-validator';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const loginDto = plainToInstance(LoginDto, request.body);

        const errors = await validate(loginDto);
        if (errors.length > 0) {
            throw new BadRequestException(errors);
        }

        return (await super.canActivate(context)) as boolean;
    }
}