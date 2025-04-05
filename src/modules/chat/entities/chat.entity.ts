import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    JoinColumn,
    JoinTable,
    ManyToMany,
    ManyToOne,
    PrimaryGeneratedColumn
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity({ name: 'chat' })
export class Chat {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'text', nullable: false })
    name: string;

    @CreateDateColumn()
    createdAt: Date;

    @DeleteDateColumn()
    deletedAt?: Date | null;

    @Column({
        type: 'boolean',
        nullable: false
    })
    isPrivate: boolean;

    @ManyToOne(() => User, {
        nullable: false,
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
    })
    @JoinColumn({
        name: 'created_by_id',
        referencedColumnName: 'id',
        foreignKeyConstraintName: 'chat_created_by_fk',
    })
    createdBy: User;

    @ManyToMany(() => User, (user) => user.chats, {
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    })
    @JoinTable({
        name: 'chat_users',
        joinColumn: {
            name: 'chat_id',
            referencedColumnName: 'id',
            foreignKeyConstraintName: 'chat_users_chat_fk',
        },
        inverseJoinColumn: {
            name: 'user_id',
            referencedColumnName: 'id',
            foreignKeyConstraintName: 'chat_users_user_fk',
        }
    })
    participants: User[];
}
