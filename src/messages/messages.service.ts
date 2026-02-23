import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './messages.entity';
import { Vote } from './vote.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { VoteDto } from './dto/vote.dto';
import { MessageResponseDto } from './dto/message-response.dto';
import { VoteResponseDto } from './dto/vote-response.dto';

@Injectable()
export class MessagesService {
    constructor(
        @InjectRepository(Message)
        private messageRepository: Repository<Message>,
        @InjectRepository(Vote)
        private voteRepository: Repository<Vote>
    ) { }

    async findAll(userId?: string): Promise<MessageResponseDto[]> {
        const messages = await this.messageRepository.find({
            relations: ['author', 'votes'],
            order: { createdAt: 'DESC' }
        });

        return messages.map(message => this.mapToMessageResponse(message, userId));
    }

    async findUserMessages(userId: string): Promise<MessageResponseDto[]> {
        const messages = await this.messageRepository.find({
            where: { authorId: userId },
            relations: ['votes'],
            order: { createdAt: 'DESC' }
        });

        return messages.map(message => this.mapToMessageResponse(message, userId));
    }

    async create(userId: string, createMessageDto: CreateMessageDto): Promise<MessageResponseDto> {
        const message = this.messageRepository.create({
            content: createMessageDto.content,
            authorId: userId
        });

        const savedMessage = await this.messageRepository.save(message);

        return this.mapToMessageResponse(savedMessage, userId);
    }

    async delete(userId: string, messageId: string): Promise<void> {
        const message = await this.messageRepository.findOne({
            where: { id: messageId },
            select: ['id', 'authorId']
        });

        if (!message) {
            throw new NotFoundException('Message not found');
        }

        if (message.authorId !== userId) {
            throw new ForbiddenException('You can only delete your own messages');
        }

        await this.messageRepository.remove(message);
    }

    async vote(userId: string, messageId: string, voteDto: VoteDto): Promise<VoteResponseDto> {
        const message = await this.messageRepository.findOne({
            where: { id: messageId }
        });

        if (!message) {
            throw new NotFoundException('Message not found');
        }

        let existingVote = await this.voteRepository.findOne({
            where: {
                userId: userId,
                messageId: messageId
            }
        });

        if (!existingVote) {
            const vote = this.voteRepository.create({
                userId,
                messageId,
                value: voteDto.value
            });
            existingVote = await this.voteRepository.save(vote);
        } else if (existingVote.value !== voteDto.value) {
            existingVote.value = voteDto.value;
            await this.voteRepository.save(existingVote);
        }

        const votes = await this.voteRepository.find({
            where: { messageId }
        });

        const voteCount = votes.reduce((sum, vote) => sum + vote.value, 0);

        const result = {
            messageId,
            voteCount,
            yourVote: voteDto.value
        };

        return result;
    }

    private mapToMessageResponse(message: Message, userId?: string): MessageResponseDto {
        const voteCount = message.votes?.reduce((sum, vote) => sum + vote.value, 0) ?? 0;
        let userVote: number | null = null;
        
        if (userId && message.votes) {
            const userVoteEntity = message.votes.find(vote => vote.userId === userId);
            userVote = userVoteEntity?.value ?? null;
        }

        return {
            id: message.id,
            content: message.content,
            authorId: message.authorId,
            authorUsername: message.author?.username,
            voteCount,
            userVote,
            createdAt: message.createdAt,
            updatedAt: message.updatedAt
        };
    }
}