import { IsIn, IsNotEmpty } from 'class-validator';

export class VoteDto {
    @IsNotEmpty({ message: 'Vote value is required' })
    @IsIn([1, -1], { message: 'Value must be either 1 (upvote) or -1 (downvote)' })
    value: 1 | -1;
}