import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { HashService } from '../common/hash.service';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private readonly hashService: HashService,
    ) {
    }

    async create(createUserDto: CreateUserDto): Promise<User> {
        const { password, ...userData } = createUserDto;
        const user = this.userRepository.create({
            password: await this.hashService.hashPassword(password),
            ...userData,
        });
        return await this.userRepository.save(user);
    }

    async findOneById({ id }: { id: string }): Promise<User> {
        const user = await this.userRepository.findOneBy({ id });

        if (!user) {
            throw new NotFoundException(`User with id ${id} not found`);
        }

        return user;
    }

    async findOneByEmailOrUsername(findCondition: { email: string; } | { username: string }): Promise<User | null> {
       return await this.userRepository.findOneBy(findCondition);
    }

    async update({ id, updateUserDto }: { id: string, updateUserDto: UpdateUserDto }): Promise<User> {
        const user = await this.userRepository.findOneBy({ id });

        if (!user) {
            throw new NotFoundException(`User with id ${id} not found`);
        }

        Object.assign(user, updateUserDto);

        if (updateUserDto.password) {
            user.password = await this.hashService.hashPassword(updateUserDto.password);
        }

        return await this.userRepository.save(user);
    }

    async delete({ id }: { id: string }): Promise<void> {
        const user = await this.userRepository.findOneBy({ id });

        if (!user) {
            throw new NotFoundException(`User with id ${id} not found`);
        }

        await this.userRepository.softRemove(user);
    }
}