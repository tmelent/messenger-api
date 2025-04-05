import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    ManyToMany,
    PrimaryGeneratedColumn,
    Unique
} from 'typeorm';
import { Chat } from '../../chat/entities/chat.entity';

@Entity()
@Unique('UQ_user_email', ['email'])
@Unique('UQ_user_username', ['username'])
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'text',
        nullable: false,
        unique: true
    })
    email: string;

    @Column({
        type: 'text',
        nullable: false,
        unique: true,
    })
    username: string;

    @Column({
        type: 'text',
        nullable: false,
    })
    password: string;

    @Column({
        type: 'boolean',
        nullable: false,
        default: 'false',
    })
    blocked: boolean;

    @DeleteDateColumn()
    deletedAt?: Date | null;

    @CreateDateColumn()
    createdAt: Date;

    @ManyToMany(() => Chat, chat => chat.participants)
    chats: Chat[];
}