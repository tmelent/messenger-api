import { Exclude, Expose } from 'class-transformer';

@Expose()
export class UserResponseDto {
    @Expose()
    id: string;

    @Expose()
    username: string;

    @Expose()
    email: string;

    @Expose()
    blocked: boolean;

    @Exclude()
    password: string;
}