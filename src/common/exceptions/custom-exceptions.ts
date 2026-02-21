import { HttpException, HttpStatus } from '@nestjs/common';

export class MessageNotFoundException extends HttpException {
    constructor(messageId?: string) {
        super(
            messageId
                ? `Message with ID ${messageId} not found`
                : 'Message not found',
            HttpStatus.NOT_FOUND
        );
    }
}

export class UnauthorizedActionException extends HttpException {
    constructor(action: string) {
        super(
            `You are not authorized to ${action}`,
            HttpStatus.FORBIDDEN
        );
    }
}

export class UserAlreadyExistsException extends HttpException {
    constructor(username: string) {
        super(
            `User with username '${username}' already exists`,
            HttpStatus.CONFLICT
        );
    }
}

export class InvalidCredentialsException extends HttpException {
    constructor() {
        super('Invalid username or password', HttpStatus.UNAUTHORIZED);
    }
}