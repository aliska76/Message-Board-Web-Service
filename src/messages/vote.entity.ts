import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from '../database/base.entity';
import { User } from '../users/user.entity';
import { Message } from './messages.entity';

@Entity('votes')
@Unique(['userId', 'messageId'])
export class Vote extends BaseEntity {
    @Column({ type: 'integer' })
    value: number;

    @ManyToOne(() => User, { eager: false })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ name: 'user_id' })
    userId: string;

    @ManyToOne(() => Message, (message) => message.votes, {
        eager: false,
        onDelete: 'CASCADE'
    })
    @JoinColumn({ name: 'message_id' })
    message: Message;

    @Column({ name: 'message_id' })
    messageId: string;
}