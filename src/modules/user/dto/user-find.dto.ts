import { Exclude, Expose } from 'class-transformer';

@Expose()
export class UserFindDto {

    @Expose()
    public id: string;

    @Exclude()
    public password: string;
}