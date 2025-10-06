# echoEnglish Admin NestJS

A standard NestJS backend application with JWT authentication, built from scratch with clean architecture.

## Features

- ✅ JWT Authentication with Bearer Token
- ✅ Global JWT Guard protecting all endpoints by default
- ✅ Public routes using `@Public()` decorator
- ✅ Login endpoint for authentication
- ✅ User profile endpoint (protected)
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
│   ├── users.controller.ts       # User endpoints
│   ├── users.service.ts          # User business logic
│   ├── users.module.ts           # User module
│   └── user.entity.ts            # User interface
├── common/
│   ├── decorators/
│   │   └── public.decorator.ts  # Public route decorator
│   └── guards/
│       └── jwt-auth.guard.ts    # JWT authentication guard
├── app.module.ts                 # Root module
└── main.ts                       # Application entry point
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
```

See `.env.example` for reference.

## Running the Application

```bash
# Development mode
npm start

# Development with watch mode (requires nodemon)
npm run start:dev

# Production mode
npm run build
npm run start:prod
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
    "id": "1",
    "email": "admin@example.com",
    "name": "Admin User"
  }
}
```

### User Profile (Protected)

#### Get Profile
```bash
GET /users/profile
Authorization: Bearer <access_token>
```

Response:
```json
{
  "id": "1",
  "email": "admin@example.com",
  "name": "Admin User",
  "createdAt": "2025-10-06T14:50:47.378Z"
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
