import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../database/base.entity';
import { Message } from '../messages/messages.entity';

@Entity('users')
export class User extends BaseEntity {
    @Column({ unique: true })
    username: string;

    @Column({ name: 'password_hash' })
    passwordHash: string;

    @OneToMany(() => Message, (message) => message.author)
    messages: Message[];
}