import {
    Controller, Delete, Get, Post, Body, Param, UseGuards, Req,
    HttpCode, HttpStatus, ParseUUIDPipe
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CreateMessageDto } from './dto/create-message.dto';
import { VoteDto } from './dto/vote.dto';
import { RequestWithUser } from '@/common/types/request-with-user.interface';

@Controller('messages')
export class MessagesController {
    constructor(private messagesService: MessagesService) { }

    @Get('user/messages')
    @UseGuards(JwtAuthGuard)
    async getUserMessages(@Req() req: RequestWithUser) {
        const userId = req.user.id;
        return this.messagesService.findUserMessages(userId);
    }

    @Get()
    async findAll(@Req() req: RequestWithUser) {
        const userId = req.user?.id;
        return this.messagesService.findAll(userId);
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    async create(@Req() req: RequestWithUser, @Body() createMessageDto: CreateMessageDto) {
        const userId = req.user.id;
        return this.messagesService.create(userId, createMessageDto);
    }

    @Post(':id/vote')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async vote(
        @Req() req: RequestWithUser,
        @Param('id', ParseUUIDPipe) messageId: string,
        @Body() voteDto: VoteDto,
    ) {
        const userId = req.user.id;
        return this.messagesService.vote(userId, messageId, voteDto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(
        @Req() req: RequestWithUser,
        @Param('id', ParseUUIDPipe) messageId: string,
    ) {
        const userId = req.user.id;
        await this.messagesService.delete(userId, messageId);
    }
}