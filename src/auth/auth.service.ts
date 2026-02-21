import { 
    ConflictException,
    Injectable,
    InternalServerErrorException,
    Logger
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { InvalidCredentialsException } from '../common/exceptions/custom-exceptions';
import { QueryFailedError } from 'typeorm';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) { }

    async register(registerDto: RegisterDto) {
        const { username, password } = registerDto;

        const hashedPassword = await bcrypt.hash(password, 10);

        try {
            const user = await this.usersService.create(username, hashedPassword);
            return this.generateToken(user);
        } catch (error: unknown) {
            // TypeORM error for SQLite
            if (error instanceof QueryFailedError) {
                const driverError = error.driverError as any;

                if (driverError.code === 'SQLITE_CONSTRAINT' &&
                    error.message.includes('username')) {
                    throw new ConflictException('Username already exists');
                }
            }

            // Other error
            this.logger.error('Registration error:', error);
            throw new InternalServerErrorException('Registration failed');
        }
    }

    async login(loginDto: LoginDto) {
        const { username, password } = loginDto;

        // Find a user
        const user = await this.usersService.findByUsername(username);

        if (!user) {
            this.logger.warn(`Login failed: user ${username} not found`);
            throw new InvalidCredentialsException();
        }
  
        // Check a password
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
            this.logger.warn(`Login failed: invalid password for ${username}`);
            throw new InvalidCredentialsException();
        }

        this.logger.log(`User logged in: ${username}`);
        return this.generateToken(user);
    }

    private generateToken(user: any) {
        const payload = {
            sub: user.id,
            username: user.username
        };

        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                username: user.username
            }
        };
    }
}