# Backend — Virtual Chemistry Lab

This repository contains the backend for the Virtual Chemistry Lab. 
It is a Node.js + Express + TypeScript service with SQLite via Drizzle ORM.

## Prerequisites

- Node.js 18+ (recommended)
- npm

## Installation

From the project root, open a terminal in the backend folder:

```bash
cd backend
npm install
```

## Environment variables

Create a `.env` file in `backend/` if it does not already exist.

Variables used by the backend with example values:

```env
PORT=3001
DB_PATH=./sqlite.db
DATABASE_URL=sqlite.db
JWT_SECRET=your-secret-key
TOKEN_EXPIRY=7d
GMAIL_USER=your-email@gmail.com
GMAIL_PASSWORD=your-app-password
FRONTEND_URL=http://localhost:3000
```

Notes:
- `DB_PATH` points to the SQLite database file.
- `JWT_SECRET` is required for authentication.
- `FRONTEND_URL` is used in email links and CORS-related flows.
- `GMAIL_USER` and `GMAIL_PASSWORD` are used by the email service.

## Database setup

The project uses Drizzle and SQLite.

Database commands:

```bash
npm run db:generate   # generate migrations from schema
npm run db:migrate    # apply migrations
npm run db:seed       # seed demo data
npm run db:setup      # generate + migrate + seed
```

To reset the local SQLite database and start over:

```bash
npm run db:reset
```

## Running the backend in development

Start the Express server in development mode:

```bash
npm run dev
```

The backend runs through `tsx` and typically listens on port `3001`.

## Testing

Run the Jest test suite:

```bash
npm test
```

Additional test commands:

```bash
npm run test:watch
npm run test:coverage
```

## Project structure

- `src/index.ts` — server entry point
- `src/routes/` — route handlers
- `src/services/` — business logic
- `src/db/` — database connection, schema, migrations, and seed script
- `src/utils/` — shared helpers
- `src/__tests__/` — automated tests

## Common issues

- If the server cannot connect to the database, check `DB_PATH` and whether the SQLite file exists.
- If authentication or email-related tests fail, verify `JWT_SECRET`, `GMAIL_USER`, and `GMAIL_PASSWORD`.
- If you modify the schema, rerun `npm run db:generate` and `npm run db:migrate`.

## Useful links inside the repo

- Database seed data: `backend/src/db/seed.ts`
- Schema definitions: `backend/src/db/schema/`
- Server entry point: `backend/src/index.ts`
- Tests: `backend/src/__tests__/`

## Quick start summary

```bash
cd backend
npm install
npm run db:setup
npm run dev
```
