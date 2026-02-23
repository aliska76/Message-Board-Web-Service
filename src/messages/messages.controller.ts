import {
    Controller,
    Delete,
    Get,
    Post,
    Body,
    Param,
    UseGuards,
    Req,
    HttpCode,
    HttpStatus,
    ParseUUIDPipe
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CreateMessageDto } from './dto/create-message.dto';
import { VoteDto } from './dto/vote.dto';
import { MessageResponseDto } from './dto/message-response.dto';
import { VoteResponseDto } from './dto/vote-response.dto';
import { RequestWithUser } from '@/common/types/request-with-user.interface';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiBody,
    ApiParam
} from '@nestjs/swagger';

@ApiTags('messages')
@Controller('messages')
export class MessagesController {
    constructor(private messagesService: MessagesService) { }

    // =========================
    // Public: Get all messages
    // =========================

    @Get()
    @ApiOperation({ summary: 'Get all messages' })
    @ApiResponse({
        status: 200,
        description: 'List of all messages',
        type: [MessageResponseDto]
    })
    async findAll(@Req() req: RequestWithUser) {
        const userId = req.user?.id;
        return this.messagesService.findAll(userId);
    }

    // =========================
    // Protected: Get user messages
    // =========================

    @Get('user/messages')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get messages of the current user' })
    @ApiResponse({
        status: 200,
        description: 'List of user messages',
        type: [MessageResponseDto]
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getUserMessages(@Req() req: RequestWithUser) {
        return this.messagesService.findUserMessages(req.user.id);
    }

    // =========================
    // Protected: Create message
    // =========================

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new message' })
    @ApiBody({ type: CreateMessageDto })
    @ApiResponse({
        status: 201,
        description: 'Message successfully created',
        type: MessageResponseDto
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @HttpCode(HttpStatus.CREATED)
    async create(
        @Req() req: RequestWithUser,
        @Body() createMessageDto: CreateMessageDto
    ) {
        return this.messagesService.create(req.user.id, createMessageDto);
    }

    // =========================
    // Protected: Vote
    // =========================

    @Post(':id/vote')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Vote on a message (upvote or downvote)' })
    @ApiParam({ name: 'id', description: 'Message UUID' })
    @ApiBody({ type: VoteDto })
    @ApiResponse({
        status: 200,
        description: 'Vote applied successfully',
        type: VoteResponseDto
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Message not found' })
    @HttpCode(HttpStatus.OK)
    async vote(
        @Req() req: RequestWithUser,
        @Param('id', ParseUUIDPipe) messageId: string,
        @Body() voteDto: VoteDto
    ) {
        return this.messagesService.vote(req.user.id, messageId, voteDto);
    }

    // =========================
    // Protected: Delete
    // =========================

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete your own message' })
    @ApiParam({ name: 'id', description: 'Message UUID' })
    @ApiResponse({ status: 204, description: 'Message deleted successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    @ApiResponse({ status: 404, description: 'Message not found' })
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(
        @Req() req: RequestWithUser,
        @Param('id', ParseUUIDPipe) messageId: string
    ) {
        await this.messagesService.delete(req.user.id, messageId);
    }
}