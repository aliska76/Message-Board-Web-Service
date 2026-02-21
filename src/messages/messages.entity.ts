import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../database/base.entity';
import { User } from '../users/user.entity';
import { Vote } from './vote.entity';

@Entity('messages')
export class Message extends BaseEntity {
    @Column('text')
    content: string;

    @ManyToOne(() => User, (user) => user.messages, { eager: false })
    @JoinColumn({ name: 'author_id' })
    author: User;

    @Column({ name: 'author_id' })
    authorId: string;

    @OneToMany(() => Vote, (vote) => vote.message)
    votes: Vote[];

    voteCount?: number;
}