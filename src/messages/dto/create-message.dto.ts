import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateMessageDto {
    @IsNotEmpty({ message: 'Message content cannot be empty' })
    @IsString({ message: 'Message content must be a string' })
    @MinLength(1, { message: 'Message must be at least 1 character long' })
    @MaxLength(1000, { message: 'Message is too long. Max length is 1000 characters.' })
    content: string;
    static content: any;
}