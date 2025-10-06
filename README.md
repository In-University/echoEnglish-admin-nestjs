# echoEnglish Admin NestJS

A standard NestJS backend application with JWT authentication and MongoDB integration, built from scratch with clean architecture.

## Features

- ✅ JWT Authentication with Bearer Token
- ✅ MongoDB integration with Mongoose
- ✅ Full CRUD operations for User management
- ✅ Global JWT Guard protecting all endpoints by default
- ✅ Public routes using `@Public()` decorator
- ✅ Login endpoint for authentication
- ✅ Soft delete support for users
- ✅ Role-based user management
- ✅ Password hashing with bcrypt
- ✅ Request validation with class-validator
- ✅ Environment configuration with @nestjs/config
- ✅ TypeScript support
- ✅ ESLint and Prettier configured

## Project Structure

```
src/
├── auth/
│   ├── dto/
│   │   └── login.dto.ts          # Login validation DTO
│   ├── auth.controller.ts        # Auth endpoints
│   ├── auth.service.ts           # Auth business logic
│   ├── auth.module.ts            # Auth module
│   └── jwt.strategy.ts           # JWT Passport strategy
├── users/
│   ├── dto/
│   │   ├── create-user.dto.ts   # Create user DTO
│   │   └── update-user.dto.ts   # Update user DTO
│   ├── users.controller.ts       # User CRUD endpoints
│   ├── users.service.ts          # User business logic
│   ├── users.module.ts           # User module
│   └── user.schema.ts            # MongoDB User schema
├── roles/
│   └── role.schema.ts            # MongoDB Role schema
├── common/
│   ├── decorators/
│   │   └── public.decorator.ts  # Public route decorator
│   ├── guards/
│   │   └── jwt-auth.guard.ts    # JWT authentication guard
│   ├── enums/
│   │   └── gender.enum.ts       # Gender enum
│   └── utils/
│       └── validation.ts         # Validation utilities
├── app.module.ts                 # Root module
├── main.ts                       # Application entry point
└── seed.ts                       # Database seeder
```

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file in the root directory:

```env
PORT=3000
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRATION=1d
MONGODB_URI=mongodb://localhost:27017/echoenglish-admin
```

See `.env.example` for reference.

## Database Setup

1. Make sure MongoDB is running on your machine or update `MONGODB_URI` in `.env` to point to your MongoDB instance.

2. Seed the database with a default admin user:

```bash
npm run seed
```

This will create:
- Email: `admin@example.com`
- Password: `admin123`

## Running the Application

```bash
# Development mode
npm start

# Development with watch mode (requires nodemon)
npm run start:dev

# Production mode
npm run build
npm run start:prod

# Seed database
npm run seed
```

## API Endpoints

### Authentication

#### Login
```bash
POST /auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "admin123"
}
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "admin@example.com",
    "fullName": "Admin User",
    "roles": []
  }
}
```

### User Management (Protected)

All user endpoints require JWT authentication via `Authorization: Bearer <token>` header.

#### Create User
```bash
POST /users
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "gender": "MALE",
  "dob": "1990-01-01",
  "phoneNumber": "0912345678",
  "address": "123 Main St",
  "image": "https://example.com/avatar.jpg",
  "roles": []
}
```

#### Get All Users
```bash
GET /users
Authorization: Bearer <access_token>

# Include soft-deleted users
GET /users?includeDeleted=true
```

#### Get User Profile (Current User)
```bash
GET /users/profile
Authorization: Bearer <access_token>
```

#### Get User by ID
```bash
GET /users/:id
Authorization: Bearer <access_token>
```

#### Update User
```bash
PUT /users/:id
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "fullName": "John Updated",
  "phoneNumber": "0987654321",
  "credits": 100
}
```

#### Delete User (Soft Delete)
```bash
DELETE /users/:id
Authorization: Bearer <access_token>
```

#### Permanent Delete User
```bash
DELETE /users/:id?hard=true
Authorization: Bearer <access_token>
```

#### Restore Deleted User
```bash
PATCH /users/:id/restore
Authorization: Bearer <access_token>
```

#### Add Credits to User
```bash
PATCH /users/:id/credits
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "amount": 50
}
```

#### Assign Roles to User
```bash
PATCH /users/:id/roles
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "roleIds": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"]
}
```

## User Schema

The User model includes the following fields:

- `fullName` (string, required): Full name of the user
- `gender` (enum: MALE, FEMALE, OTHER): User's gender
- `dob` (Date): Date of birth
- `email` (string, required, unique): User's email address
- `password` (string, required, 8-100 chars): Hashed password
- `phoneNumber` (string): Vietnamese phone number format
- `address` (string): Physical address
- `image` (string): Avatar/profile image URL
- `roles` (ObjectId[]): References to Role documents
- `credits` (number, default: 0): User credits/tokens
- `isDeleted` (boolean, default: false): Soft delete flag
- `createdAt` (Date): Auto-generated timestamp
- `updatedAt` (Date): Auto-generated timestamp

### User Profile (Protected)

#### Get Profile
```bash
GET /users/profile
Authorization: Bearer <access_token>
```

Response:
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "fullName": "Admin User",
  "email": "admin@example.com",
  "gender": "OTHER",
  "credits": 0,
  "roles": [],
  "isDeleted": false,
  "createdAt": "2025-10-06T14:50:47.378Z",
  "updatedAt": "2025-10-06T14:50:47.378Z"
}
```

## Authentication Flow

1. **All endpoints are protected by default** - The `JwtAuthGuard` is registered globally in `app.module.ts`
2. **Public routes** - Use the `@Public()` decorator to bypass authentication (e.g., login endpoint)
3. **JWT middleware** - The guard automatically validates JWT tokens and attaches user info to `req.user`
4. **User context** - Authenticated user data is available in controllers via `@Request()` decorator

## Default User

A default admin user is created automatically:
- Email: `admin@example.com`
- Password: `admin123`

## Testing the API

### Test Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin123"}'
```

### Test Protected Endpoint
```bash
# Get the token from login response
TOKEN="your-token-here"

# Access protected endpoint
curl -X GET http://localhost:3000/users/profile \
  -H "Authorization: Bearer $TOKEN"
```

### Test Without Token (Should fail with 401)
```bash
curl -X GET http://localhost:3000/users/profile
```

## Development Commands

```bash
# Build the project
npm run build

# Lint the code
npm run lint

# Format code with Prettier
npm run format
```

## Security Features

- **Password Hashing**: All passwords are hashed using bcrypt before storage
- **JWT Tokens**: Secure token-based authentication
- **Global Guard**: All endpoints are private by default
- **Validation**: Request data is validated using class-validator
- **Environment Variables**: Sensitive data stored in .env files

## Adding New Protected Endpoints

All endpoints are protected by default. Simply create a new controller:

```typescript
@Controller('example')
export class ExampleController {
  @Get()
  findAll(@Request() req) {
    // req.user contains the authenticated user
    return { message: 'This is protected' };
  }
}
```

## Adding Public Endpoints

Use the `@Public()` decorator:

```typescript
import { Public } from './common/decorators/public.decorator';

@Controller('public')
export class PublicController {
  @Public()
  @Get()
  getPublicData() {
    return { message: 'This is public' };
  }
}
```

## License

ISC
