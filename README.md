# audio-core

NestJS service that provides:

- JWT authentication backed by PostgreSQL + pgcrypto
- CRUD API for `Summarize` records
- Transparent **WebSocket stream proxy** (audio ↔ backend)
- Transparent **REST WAV stream proxy** (audio → backend)

## Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js ≥ 20 |
| Framework | NestJS 11 |
| ORM | Prisma 7 |
| Database | PostgreSQL 18 |
| Auth | JWT |
| WebSocket | `ws` (raw WebSocket, NestJS `WsAdapter`) |

---

## Prerequisites

- Node.js ≥ 20
- Docker + Docker Compose
- `npm`

---

## Quick start

```bash
# 1. Clone & install
npm install

# 2. Copy env file and adjust if needed
cp .env.example .env

# 3. Start PostgreSQL 18
docker-compose up -d

# 4. Generate Prisma client and apply migrations (creates tables + seeds users)
npx prisma generate
npx prisma migrate deploy

# 5. Start the service
npm run start:dev
```

HTTP server → `http://localhost:3000`  
WebSocket gateway → `ws://localhost:3001/ws/proxy`

---

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | — | PostgreSQL connection string |
| `JWT_SECRET` | — | Secret key for signing JWT tokens |
| `JWT_EXPIRES_IN` | `24h` | Token lifetime |
| `PORT` | `3000` | HTTP server port |
| `WS_PORT` | `3001` | WebSocket gateway port |
| `PROXY_WS_TARGET` | `ws://localhost:8080` | Backend WS service URL |
| `PROXY_REST_TARGET` | `http://localhost:8080` | Backend REST service base URL |
| `PROXY_REST_PATH` | `/audio` | Path appended to `PROXY_REST_TARGET` |

---

## Authentication

The service uses **JWT Bearer tokens**.

### Login

```http
POST /auth/login
Content-Type: application/json

{ "login": "admin", "password": "admin" }
```

Response:

```json
{
  "access_token": "<JWT>",
  "user": { "id": 1, "login": "admin", "role": "admin" }
}
```

### Using the token

**REST** — add the header to every request:

```
Authorization: Bearer <access_token>
```

**WebSocket** — append the token as a query parameter when opening the connection:

```
ws://localhost:3001/ws/proxy?token=<access_token>
```

The connection is closed with code `1008` if the token is missing or invalid.

### Seeded users

| Login | Password | Role |
|---|---|---|
| `admin` | `admin` | admin |
| `manager` | `manager` | manager |
| `demo` | `demo` | user |

Passwords are stored as bcrypt hashes using PostgreSQL's `pgcrypto` extension. They are **never** compared in application code — the database performs the comparison with `crypt($password, "passwordHash")`.

---

## REST API

All endpoints below (except `/auth/login`) require `Authorization: Bearer <token>`.

### Summarize CRUD

| Method | Path | Description |
|---|---|---|
| `GET` | `/summarize` | List all records (newest first) |
| `GET` | `/summarize/:id` | Get one record |
| `POST` | `/summarize` | Create record |
| `PUT` | `/summarize/:id` | Update record (partial) |
| `DELETE` | `/summarize/:id` | Delete record (204) |

#### Create / Update body

```json
{
  "description": "Meeting notes 2026-04-28",
  "transcribe": "Raw transcript text...",
  "summarize": "Summary of the transcript..."
}
```

### Audio REST proxy

```http
POST /proxy/audio
Authorization: Bearer <token>
Content-Type: audio/wav

<raw WAV bytes>
```

The request body is forwarded as-is to `PROXY_REST_TARGET` + `PROXY_REST_PATH`.  
The upstream response (headers + body stream) is piped back to the caller.

---

## WebSocket stream proxy

Connect to:

```
ws://localhost:3001/ws/proxy?token=<access_token>
```

All binary and text frames received from the client are forwarded to the backend service at `PROXY_WS_TARGET`, and vice-versa. The proxy is fully transparent — no message format transformation is applied.

**Close codes:**

| Code | Meaning |
|---|---|
| `1008` | Unauthorized (bad or missing token) |
| `1011` | Backend WebSocket error |

---

## Database migrations

Migrations live in `prisma/migrations/` and are applied in order by Prisma.

| Migration | Description |
|---|---|
| `20260101000000_init` | Creates tables, enum, pgcrypto extension |
| `20260101000001_seed_users` | Inserts default admin / manager / demo users |

```bash
# Apply all pending migrations (production)
npx prisma migrate deploy

# Create a new migration during development
npx prisma migrate dev --name <migration_name>
```

---

## Project structure

```
src/
├── main.ts                   Entry point — loads .env, configures adapters
├── app.module.ts
├── constants.ts              Env-derived constants used in decorators
├── prisma/                   Global PrismaService
├── auth/
│   ├── auth.controller.ts    POST /auth/login
│   ├── auth.service.ts       pgcrypto password validation, JWT signing
│   ├── strategies/           JWT Passport strategy
│   └── guards/               JwtAuthGuard (REST), WsJwtGuard (WebSocket)
├── summarize/                CRUD module for Summarize table
└── proxy/
    ├── proxy.controller.ts   POST /proxy/audio  (REST WAV proxy)
    └── proxy.gateway.ts      ws://…/ws/proxy    (WebSocket stream proxy)
```
