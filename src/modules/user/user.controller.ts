import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { UserResponseDto } from './dto/user-response.dto';
import { plainToClass } from 'class-transformer';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {
    }

    @Get(':id')
    async findOne(@Param('id') id: string): Promise<UserResponseDto> {
        console.log('id')
        const user = await this.userService.findOneById({ id });

        return plainToClass(UserResponseDto, user);
    }

    @Post()
    async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
        const user = await this.userService.create(createUserDto);
        return plainToClass(UserResponseDto, user);
    }

    @Patch(':id')
    async update(
        @Param('id') id: string,
        @Body() updateUserDto: UpdateUserDto,
    ): Promise<UserResponseDto> {
        const user = await this.userService.update({ id, updateUserDto });
        return plainToClass(UserResponseDto, user);
    }

    @Delete(':id')
    async delete(
        @Param('id') id: string,
    ): Promise<void> {
        await this.userService.delete({ id });
    }
}