import { User as UserEntity } from '../modules/user/entities/user.entity';

declare global {
    namespace Express {
        interface User extends UserEntity {}
    }
}