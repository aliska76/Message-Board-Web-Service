# Message Board Web Service

A RESTful API service for a message board application built with NestJS, TypeORM, and SQLite.

## 🛠️ Tech Stack

- **Framework**: NestJS (built on top of Express.js)
- **Database**: SQLite with TypeORM
- **Authentication**: JWT + Passport
- **Validation**: class-validator
- **Rate Limiting**: @nestjs/throttler
- **Documentation**: Swagger UI
- **Testing**: Jest + Supertest (unit + e2e tests)

## 🚀 Features
### Authentication
- User registration with email and password
- JWT-based login for secure authentication
- Stateless logout (client-side token removal)
- Password encryption for security

### Message Management
- Create new messages
- View all messages with real-time vote counts
- View messages specific to the authenticated user
- Delete your own messages

### Voting System
- Upvote or downvote messages
- Each user can vote only once per message
- Real-time vote count updates

### Security & Validation
- Rate limiting to prevent abuse
- Input validation and sanitization
- Centralized error handling
- Protected routes with JWT verification

###  API Documentation
- Interactive Swagger UI documentation
- Easy-to-test API endpoints
- Detailed request/response examples

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

## 🏗 Architecture Notes

The application is built using NestJS, which is a structured framework built on top of Express.

Although Express handles the underlying HTTP layer, Nest provides:
- Dependency Injection
- Modular architecture
- Guards, Pipes, and Interceptors
- Structured error handling
- Built-in support for OpenAPI (Swagger)

This allows the application to maintain a clean and scalable architecture while still leveraging the simplicity and performance of Express under the hood.

## 🔒 Security Considerations
### 1️⃣ Password Storage

User passwords are never stored in plain text.

- Passwords are hashed using a strong one-way hashing algorithm (e.g. bcrypt)
- Salt is automatically generated
- Only password hashes are stored in the database
This prevents credential leakage even if the database is compromised.

### 2️⃣ JWT Authentication

Authentication is implemented using JSON Web Tokens.

- Tokens are signed using a secret key
- Protected routes use JwtAuthGuard
- The application is stateless (no server-side session storage)

Token expiration is enforced to reduce long-term token abuse risk.

### 3️⃣ Input Validation

All incoming requests are validated using NestJS ValidationPipe.

- DTO-based validation
- Whitelisting enabled (strips unknown properties)
- Prevents mass assignment attacks

Invalid input results in HTTP 400 responses.

### 4️⃣ Authorization Checks

Authorization is enforced at the service layer:

- Users can delete only their own messages
- Users can vote only once per message (unique constraint)
- Ownership is verified before destructive operations

Unauthorized access returns HTTP 403.

### 5️⃣ Rate Limiting

Rate limiting is implemented using NestJS Throttler.

- Prevents brute-force login attempts
- Prevents vote spamming
- Protects public endpoints from abuse

Exceeding limits results in HTTP 429.

### 6️⃣ Database Integrity

- UUID primary keys reduce enumeration risks
- Unique constraints prevent duplicate votes
- Foreign keys enforce relational integrity

### 7️⃣ Error Handling

The application uses centralized exception filters:

- Consistent error responses
- No stack traces exposed in production
- Proper HTTP status codes (400, 401, 403, 404, 429, 500)

### 8️⃣ SQL Injection Protection

TypeORM uses parameterized queries internally, preventing SQL injection attacks when used properly.

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

## Database Schema

A reference SQLite schema is provided in:

database/schema.sql

Note:
The application uses TypeORM with `synchronize: true`, so tables are generated automatically at runtime.
The schema file is provided for clarity and production reference.

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
<img width="1458" height="703" alt="image" src="https://github.com/user-attachments/assets/ec50ab26-a037-49bc-8709-e43e568b27e7" />

### 🔐 Authentication in Swagger
1. **Get your token** by registering or logging in:

- POST /auth/register - create a new account
- POST /auth/login - login with existing credentials

2. **Authorize in Swagger**:

- Click the 🔒 lock icon at the top right of the Swagger page
- In the popup, enter your token
- Click "Authorize" and close the dialog

3. **Swagger will remember your token** for all subsequent requests that require authentication. The lock icon will appear closed (🔒) to indicate you're authorized.

### 📌 Important Notes
- Tokens are valid for **24 hours** (configurable)
- You only need to authorize once per Swagger session
- All endpoints marked with a lock icon (🔒) require authentication
- If you get a 401 error, your token may have expired - just log in again and update the token

### 🔍 Example Flow
1. Register a new user: POST /auth/register
2. Copy the access_token from the response
3. Click the lock icon and paste: Bearer eyJhbGciOiJIUzI1NiIs...
4. Now you can test protected endpoints like:
- POST /messages
- POST /messages/{id}/vote
- DELETE /messages/{id}
- GET /user/messages

This way, you can easily test the entire API flow without manually adding tokens to each request! 🚀 


## 📡 API Endpoints
### Auth Endpoints
| Method	| Endpoint	| Description	| Auth Required
| :--- | :--- | :--- | :--- |
| POST	| /auth/register	| Register new user	| No
| POST	| /auth/login	| Login user	| No
| POST	| /auth/logout	| Logout user	| Yes
### Messages Endpoints
| Method	| Endpoint	| Description	| Auth Required
| :--- | :--- | :--- | :--- |
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
| Variable |	Description |	Default
| :--- | :--- | :--- |
| JWT_SECRET | Secret key for JWT |	Required
| PORT | Server port| 3000
| NODE_ENV| Environment	| development

## 🧪 Testing
```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# test coverage
npm run test:cov

# throttler tests
npm run test:e2e -- throttler.e2e-spec.ts
```

## 👥 Authors
Alisa Rakhlina
