export class MessageResponseDto {
    id: string;
    content: string;
    authorId: string;
    authorUsername?: string;
    voteCount: number;
    createdAt: Date;
    updatedAt: Date;
    userVote?: number;
}