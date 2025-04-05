import { HashService } from "../../modules/common/hash.service";
import { User } from '../../modules/user/entities/user.entity';
import { UserService } from '../../modules/user/user.service';
import { Repository } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';


describe('UserService', () => {
    let service: UserService;
    let userRepository: Repository<User>;
    let hashService: HashService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [ConfigModule],
            providers: [
                UserService,
                HashService,
                {
                    provide: getRepositoryToken(User),
                    useValue: {
                        create: jest.fn(),
                        save: jest.fn(),
                        findOneBy: jest.fn(),
                        softRemove: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<UserService>(UserService);
        userRepository = module.get<Repository<User>>(getRepositoryToken(User));
        hashService = module.get<HashService>(HashService);
    });

    describe('create', () => {
        it('should create a new user successfully', async () => {
            const createUserDto = { email: 'test@example.com', username: 'testuser', password: 'password123' };
            const hashedPassword = 'hashedpassword';

            jest.spyOn(hashService, 'hashPassword').mockResolvedValue(hashedPassword);

            const newUser = {
                email: 'test@example.com',
                username: 'testuser',
                password: hashedPassword,
            };

            const createMock = jest.spyOn(userRepository, 'create').mockReturnValue(<User>{
                ...createUserDto,
                password: hashedPassword,
            });
            const saveMock = jest.spyOn(userRepository, 'save').mockResolvedValue(newUser as User);

            const result = await service.create(createUserDto);

            expect(result).toEqual(newUser);

            expect(createMock).toHaveBeenCalledWith({
                password: hashedPassword,
                email: 'test@example.com',
                username: 'testuser',
            });

            expect(hashService.hashPassword).toHaveBeenCalledWith('password123');

            expect(saveMock).toHaveBeenCalledWith({
                email: 'test@example.com',
                username: 'testuser',
                password: hashedPassword,
            });

        });
    });


    describe('findOneById', () => {
        it('should return the user by id', async () => {
            const user = { id: 'test-uuid', email: 'test@example.com', username: 'testuser' };

            jest.spyOn(userRepository, 'findOneBy').mockResolvedValue(<User>user);

            const result = await service.findOneById({ id: 'test-uuid-1' });

            expect(result).toEqual(user);
            expect(userRepository.findOneBy).toHaveBeenCalledWith({ id: 'test-uuid-1' });
        });

        it('should throw NotFoundException if the user is not found', async () => {
            jest.spyOn(userRepository, 'findOneBy').mockResolvedValue(null);

            await expect(service.findOneById({ id: 'test-uuid-1' })).rejects.toThrow(
                new NotFoundException(`User with id test-uuid-1 not found`),
            );
        });
    });

    describe('findOneByEmailOrUsername', () => {
        it('should return a user by email', async () => {
            const user = { id: 'test-uuid', email: 'test@example.com', username: 'testuser' };
            jest.spyOn(userRepository, 'findOneBy').mockResolvedValue(<User>user);

            const result = await service.findOneByEmailOrUsername({ email: 'test@example.com' });

            expect(result).toEqual(user);
            expect(userRepository.findOneBy).toHaveBeenCalledWith({ email: 'test@example.com' });
        });

        it('should return a user by username', async () => {
            const user = { id: 'test-uuid', email: 'test@example.com', username: 'testuser' };
            jest.spyOn(userRepository, 'findOneBy').mockResolvedValue(<User>user);

            const result = await service.findOneByEmailOrUsername({ username: 'testuser' });

            expect(result).toEqual(user);
            expect(userRepository.findOneBy).toHaveBeenCalledWith({ username: 'testuser' });
        });
    });

    describe('update', () => {
        it('should update a user successfully', async () => {
            const updateUserDto = { email: 'newemail@example.com', password: 'newpassword' };
            const user = { id: 'test-uuid', email: 'test@example.com', username: 'testuser', password: 'hashedpassword' };
            const updatedUser = { ...user, ...updateUserDto, password: 'hashednewpassword' };

            jest.spyOn(userRepository, 'findOneBy').mockResolvedValue(<User>user);
            jest.spyOn(hashService, 'hashPassword').mockResolvedValue('hashednewpassword');
            jest.spyOn(userRepository, 'save').mockResolvedValue(<User>updatedUser);

            const result = await service.update({ id: 'test-uuid-1', updateUserDto });

            expect(result).toEqual(updatedUser);
            expect(userRepository.findOneBy).toHaveBeenCalledWith({ id: 'test-uuid-1' });
            expect(hashService.hashPassword).toHaveBeenCalledWith('newpassword');
            expect(userRepository.save).toHaveBeenCalledWith(updatedUser);
        });

        it('should throw NotFoundException if the user is not found', async () => {
            const updateUserDto = { email: 'newemail@example.com' };

            jest.spyOn(userRepository, 'findOneBy').mockResolvedValue(null);

            await expect(service.update({ id: 'test-uuid-1', updateUserDto })).rejects.toThrow(
                new NotFoundException('User with id test-uuid-1 not found'),
            );
        });
    });

    describe('delete', () => {
        it('should delete the user successfully', async () => {
            const user = { id: 'test-uuid', email: 'test@example.com', username: 'testuser' };

            jest.spyOn(userRepository, 'findOneBy').mockResolvedValue(<User>user);
            jest.spyOn(userRepository, 'softRemove').mockResolvedValue(<User>{});

            await service.delete({ id: 'test-uuid-1' });

            expect(userRepository.findOneBy).toHaveBeenCalledWith({ id: 'test-uuid-1' });
            expect(userRepository.softRemove).toHaveBeenCalledWith(user);
        });

        it('should throw NotFoundException if the user is not found', async () => {
            jest.spyOn(userRepository, 'findOneBy').mockResolvedValue(null);

            await expect(service.delete({ id: 'test-uuid-1' })).rejects.toThrow(
                new NotFoundException('User with id test-uuid-1 not found'),
            );
        });
    });
});
