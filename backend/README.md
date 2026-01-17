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

Swagger UI available at `http://localhost:3001/docs` when the server is running.

## Project Structure

```
src/
├── db/
│   ├── index.ts       # Database connection
│   └── schema.ts      # Drizzle table definitions
├── middleware/
│   └── errorHandler.ts
├── routes/
│   ├── applications.ts
│   ├── companies.ts
│   ├── contacts.ts
│   ├── interactions.ts
│   ├── positions.ts
│   └── reminders.ts
├── schemas/           # Zod validation schemas
├── app.ts
└── index.ts
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | `localhost` | Database host |
| `DB_PORT` | `5433` | Database port |
| `DB_USER` | `dev` | Database user |
| `DB_PASSWORD` | `dev` | Database password |
| `DB_NAME` | `job_tracker` | Database name |
| `NODE_ENV` | `development` | Environment mode |
