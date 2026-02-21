import { 
    Controller,
    Post, 
    Body, 
    HttpCode, 
    HttpStatus, 
    UseGuards, 
    Req 
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt.guard';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBody,
    ApiBearerAuth
} from '@nestjs/swagger';
import { RequestWithUser } from '@/common/types/request-with-user.interface';

@ApiTags('auth') 
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    @Throttle({ default: { limit: 5, ttl: 60000 } })
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Register a new user' })
    @ApiBody({ type: RegisterDto })
    @ApiResponse({
        status: 201,
        description: 'User successfully registered',
        schema: {
            example: {
                access_token: 'eyJhbGciOiJIUzI1NiIs...',
                user: {
                    id: '123e4567-e89b-12d3-a456-426614174000',
                    username: 'john_doe'
                }
            }
        }
    })
    @ApiResponse({ status: 400, description: 'Validation error' })
    @ApiResponse({ status: 409, description: 'Username already exists' })
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Post('login')
    @Throttle({ default: { limit: 10, ttl: 60000 } }) 
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Login user' })
    @ApiBody({ type: LoginDto })
    @ApiResponse({
        status: 200,
        description: 'User successfully logged in',
        schema: {
            example: {
                access_token: 'eyJhbGciOiJIUzI1NiIs...',
                user: {
                    id: '123e4567-e89b-12d3-a456-426614174000',
                    username: 'john_doe'
                }
            }
        }
    })
    @ApiResponse({ status: 401, description: 'Invalid credentials' })
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @Post('logout')
    @SkipThrottle()
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Logout user' })
    @ApiResponse({
        status: 200,
        description: 'User successfully logged out',
        schema: {
            example: {
                message: 'Logged out successfully'
            }
        }
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async logout(@Req() req: RequestWithUser) {
        const user = req.user;
        return {
            message: 'Logged out successfully',
            user: user?.username
        };
    }
}