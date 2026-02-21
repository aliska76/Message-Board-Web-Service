import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { MessagesModule } from './messages/messages.module';
import { DatabaseModule } from './database/database.module';
import { ThrottlerBehindProxyGuard } from './common/guards/throttler-behind-proxy.guard';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env'
    }),
    
    // Rate limiting
    ThrottlerModule.forRoot([{
      name: 'short',
      ttl: 1000,
      limit: 3
    }, {
      name: 'medium',
      ttl: 60000,
      limit: 10
    }, {
      name: 'long',
      ttl: 3600000,
      limit: 100
    }]),

    // DataBase
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'database.sqlite',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
      logging: process.env.NODE_ENV === 'development'
    }),
    UsersModule,
    AuthModule,
    MessagesModule,
    DatabaseModule
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerBehindProxyGuard // Custom guard for rate limiting
    }
  ]
})
export class AppModule {}
