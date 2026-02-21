# Message Board Web Service

A RESTful API service for a message board application built with NestJS, TypeORM, and SQLite.

## 🚀 Features

- User registration and authentication (JWT)
- Create, read, and delete messages
- Vote (upvote/downvote) on messages
- View all messages with vote counts
- View user's own messages
- Rate limiting protection
- Input validation
- Error handling
- Swagger API documentation

## 🛠️ Tech Stack

- **Framework**: NestJS
- **Database**: SQLite with TypeORM
- **Authentication**: JWT + Passport
- **Validation**: class-validator
- **Rate Limiting**: @nestjs/throttler
- **Documentation**: Swagger UI
- **Testing**: Jest + Supertest

## 📦 Features
- User registration
- User login (JWT-based authentication)
- Logout (stateless)
- Create messages
- Vote (up/down)
- Delete own messages
- Get all messages with vote count
- Get user messages
- Rate limiting
- Input validation
- Centralized error handling

## 🏗 Architecture

The application follows a modular architecture:
```bash
src/
 ├── auth/
 ├── users/
 ├── messages/
 ├── database/
 └── common/
```

Principles:

- Separation of concerns
- Dependency Injection
- Thin controllers
- Business logic inside services
- Repository pattern via TypeORM

## 🗄 Database

SQLite local file:
```pgsql
database.sqlite
```

Entities:

- User
- Message
- Vote

Each entity includes:

- uuid primary key
- createdAt
- updatedAt

Vote uniqueness constraint:

```
UNIQUE(user_id, message_id)
```

## 🔐 Authentication

JWT-based authentication.

- Access token returned on login
- Protected endpoints use JwtAuthGuard
- Stateless logout

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn

## 🔧 Installation

1. Clone the repository:
```bash
git clone https://github.com/aliska76/Message-Board-Web-Service.git
cd cibus-web-service
```

2. Install dependencies:
```bash
npm install
```
Create .env file:

```env
JWT_SECRET=your-super-secret-jwt-key
PORT=3000
NODE_ENV=development
```
## 🚀 Running the app
```bash
# development
npm run start

# watch mode
npm run start:dev

# production mode
npm run start:prod
```

## 📚 API Documentation
Once the app is running, visit:

```text
http://localhost:3000/api
```
Swagger UI provides interactive API documentation where you can test all endpoints.


## 🧪 Testing
```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# test coverage
npm run test:cov
```

### 🧪 Example Test Commands
```bash
# Run all e2e tests
npm run test:e2e

# Run specific test file
npm run test:e2e -- auth.e2e-spec.ts

# Run with verbose output
npm run test:e2e -- --verbose

# Run with coverage
npm run test:cov
```

## 📡 API Endpoints
### Auth Endpoints
| Method	| Endpoint	| Description	| Auth Required
| :--- | :---: | ---: | ---: |
| POST	| /auth/register	| Register new user	| No
| POST	| /auth/login	| Login user	| No
| POST	| /auth/logout	| Logout user	| Yes
### Messages Endpoints
| Method	| Endpoint	| Description	| Auth Required
| :--- | :---: | ---: | ---: |
| GET	| /messages	| Get all messages	| No
| POST	| /messages	| Create new message	| Yes
| POST	| /messages/:id/vote	| Vote on message	| Yes
| DELETE	| /messages/:id	| Delete own message	| Yes
| GET	| /messages/user/messages	| Get user's messages	| Yes

## 📦 DTOs
### Register DTO
```json
{
  "username": "john_doe",
  "password": "Password123"
}
```

### Login DTO
```json
{
  "content": "Hello, world!"
}
```

### Vote DTO
```json
{
  "value": 1  // 1 for upvote, -1 for downvote
}
```

## 🔒 Rate Limiting
- Register: 3 requests per minute
- Login: 3 requests per minute
- Other endpoints: 10 requests per minute

## 🗄️ Database Schema

### Users
- id (UUID) - Primary key
- username (string, unique)
- passwordHash (string)
- createdAt (datetime)
- updatedAt (datetime)

### Messages
- id (UUID) - Primary key
- content (text)
- authorId (UUID) - Foreign key to users
- createdAt (datetime)
- updatedAt (datetime)

### Votes
- id (UUID) - Primary key
- value (integer: 1 or -1)
- userId (UUID) - Foreign key to users
- messageId (UUID) - Foreign key to messages
- createdAt (datetime)
- updatedAt (datetime)
- Unique constraint: (userId, messageId)

## 📝 Environment Variables
| JWT_SECRET | Secret key for JWT |	Required
| :--- | :---: | ---: |
| PORT | Server port| 3000
| NODE_ENV| Environment	| development


## 👥 Authors
Alisa Rakhlina