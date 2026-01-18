# Job Tracker Backend

Express + TypeScript REST API for the Job Tracker application.

## Prerequisites

- Node.js 20+
- PostgreSQL 16+ (or Docker)

## Setup

### With Docker (recommended)

```bash
# From the project root
docker compose up -d
```

The API will be available at `http://localhost:3001`.

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file:
```env
DB_HOST=localhost
DB_PORT=5433
DB_USER=dev
DB_PASSWORD=dev
DB_NAME=job_tracker
```

3. Run database migrations:
```bash
npm run db:migrate
```

4. Start the development server:
```bash
npm run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript |
| `npm start` | Run compiled code |
| `npm test` | Run tests |
| `npm run db:generate` | Generate migrations from schema |
| `npm run db:migrate` | Apply migrations |
| `npm run db:studio` | Open Drizzle Studio GUI |

## API Documentation

Swagger UI available at `http://localhost:3001/docs` in development mode (disabled in production).

## Project Structure

```
src/
├── config/
│   └── passport.ts    # OAuth strategies
├── db/
│   ├── index.ts       # Database connection
│   └── schema.ts      # Drizzle table definitions
├── middleware/
│   ├── auth.ts        # JWT authentication
│   └── errorHandler.ts
├── routes/
│   ├── applications.ts
│   ├── auth.ts        # Authentication endpoints
│   ├── companies.ts
│   ├── contacts.ts
│   ├── dashboard.ts
│   ├── interactions.ts
│   ├── positions.ts
│   └── reminders.ts
├── schemas/           # Zod validation schemas
├── utils/
│   └── auth.ts        # Token and password utilities
├── app.ts
└── index.ts
```

## Authentication

The API uses JWT-based authentication. All routes except `/auth/*` require a valid access token. The `/docs` endpoint is only available in development mode.

### Auth Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/register` | POST | Register with email/password |
| `/auth/login` | POST | Login with email/password |
| `/auth/refresh` | POST | Refresh access token |
| `/auth/logout` | POST | Invalidate refresh token |
| `/auth/me` | GET | Get current user (protected) |
| `/auth/google` | GET | Initiate Google OAuth |
| `/auth/github` | GET | Initiate GitHub OAuth |

### Using Authentication

Include the access token in the Authorization header:
```
Authorization: Bearer <access_token>
```

Access tokens expire after 15 minutes. Use the refresh token to get a new access token.

### OAuth Setup

To enable Google/GitHub OAuth, create OAuth apps and configure the credentials:

**Google:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Add `http://localhost:3001/auth/google/callback` as authorized redirect URI

**GitHub:**
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App
3. Set callback URL to `http://localhost:3001/auth/github/callback`

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | `localhost` | Database host |
| `DB_PORT` | `5433` | Database port |
| `DB_USER` | `dev` | Database user |
| `DB_PASSWORD` | `dev` | Database password |
| `DB_NAME` | `job_tracker` | Database name |
| `NODE_ENV` | `development` | Environment mode |
| `JWT_SECRET` | (dev default) | Secret for signing JWTs (32+ chars in production) |
| `JWT_ACCESS_EXPIRY` | `15m` | Access token expiry |
| `JWT_REFRESH_EXPIRY` | `7d` | Refresh token expiry |
| `GOOGLE_CLIENT_ID` | - | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | - | Google OAuth client secret |
| `GOOGLE_CALLBACK_URL` | `http://localhost:3001/auth/google/callback` | Google OAuth callback |
| `GITHUB_CLIENT_ID` | - | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | - | GitHub OAuth client secret |
| `GITHUB_CALLBACK_URL` | `http://localhost:3001/auth/github/callback` | GitHub OAuth callback |
| `FRONTEND_URL` | `http://localhost:3000` | Frontend URL for OAuth redirects |
