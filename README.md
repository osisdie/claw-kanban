# Claw Kanban

A visual task-tracking system designed for AI agents and humans to share a single source of truth. Built to solve two core problems in agentic workflows: **context loss** (agents forgetting tasks during long-running sessions) and **credential opacity** (agents acquiring permissions without transparent tracking).

![Kanban Board](docs/screenshots/light-01-board.png)

## Why Claw Kanban?

When AI agents run long tasks — especially in "vibe coding" sessions — they lose track of work as the context window fills up. Claw Kanban gives agents a persistent external memory they can query (`GET /tickets?status=TODO,Pending Confirm`) to recover state after context resets.

The **Security Panel** provides real-time visibility into what permissions and credentials an agent holds, with explicit approve/deny controls and a deliberately inconvenient "YOLO" bypass button (inspired by `--dangerously-skip-permissions`).

## Features

### Kanban Board with Drag-and-Drop
Five-column board with enforced state machine transitions:
```
TODO → Doing → Pending Confirm → Testing → Done
              ↘ (fallback)    ↗
```

![Security Panel](docs/screenshots/light-02-security.png)

### Security Panel
A dedicated "6th column" showing:
- **Permissions** with color-coded status (green = granted, amber = pending, red = revoked)
- **Stored credentials** with rotation tracking
- **YOLO button** — grants all pending permissions with double-confirm and audit logging

### Ticket Detail with Comment Threads
Agent and human comments are visually distinguished, creating a clear conversation trail:

![Ticket Detail](docs/screenshots/light-03-detail.png)

### Light / Dark Mode
Toggle between light and dark themes — light mode is the default for readability, with a "Dark" button in the header.

### Multi-Agent Views
- **Tag mode** (default): All tickets in one board, tagged by agent/channel
- **Swimlane mode**: Horizontal grouping per agent — one click to toggle

### API Key Management
Each API key is scoped to a project with a 1,000-action quota. Keys are hashed (SHA-256) at rest — the raw key is shown only once at creation.

![Login](docs/screenshots/light-04-login.png)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.12, FastAPI, SQLAlchemy 2.0, Alembic |
| Frontend | React 18, Vite, TailwindCSS, @dnd-kit, Zustand |
| Database | PostgreSQL 16, Redis 7 |
| Auth | Email/password (bcrypt) + Google OAuth2 + JWT |
| Real-time | WebSocket with project-scoped broadcast |
| Security | Fernet encryption for credentials, SHA-256 key hashing |
| Testing | pytest (async), Playwright (E2E) |
| CI/CD | GitHub Actions + GitLab CI |
| Deploy | Docker Compose |

## Quick Start

```bash
# Clone and run
git clone https://github.com/<your-org>/claw-kanban.git
cd claw-kanban
docker compose up --build

# Backend:  http://localhost:8005
# Frontend: http://localhost:5178
```

## API Reference

All non-auth routes require `Authorization: Bearer <api_key>` header.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/auth/register` | Email registration |
| `POST` | `/auth/token` | Login → JWT |
| `POST` | `/auth/google` | Google OAuth callback |
| `GET/POST` | `/api-keys` | List / create API keys (max 10) |
| `DELETE` | `/api-keys/{id}` | Delete key |
| `GET/POST` | `/tickets` | List / create tickets |
| `PATCH` | `/tickets/{id}` | Update ticket fields |
| `POST` | `/tickets/{id}/move` | Move ticket (with reason) |
| `POST` | `/tickets/{id}/comments` | Add timestamped comment |
| `GET` | `/tickets/{id}/history` | Get transition history |
| `GET/POST` | `/permissions` | List / request permissions |
| `PATCH` | `/permissions/{id}` | Approve / revoke |
| `POST` | `/permissions/bypass` | YOLO: grant all pending (requires confirm) |
| `POST` | `/permissions/credentials` | Store encrypted credential |
| `WS` | `/ws/board?project=<name>` | Real-time ticket updates |

### Agent Integration

Add this to your agent's system prompt:

```markdown
You have a kanban board at: https://your-claw-kanban.example.com
API Key: <key>

- Before starting a task: move ticket from TODO to Doing
- When blocked: move to Pending Confirm, add a comment explaining why
- If you lose context: GET /tickets?status=TODO,Pending+Confirm to recover
- When done: move to Done with a summary comment
```

## Project Structure

```
claw-kanban/
├── backend/
│   ├── app/
│   │   ├── core/          # Config, database, security, dependencies
│   │   ├── models/        # SQLAlchemy models (User, Ticket, Permission)
│   │   ├── schemas/       # Pydantic request/response schemas
│   │   ├── routers/       # API route handlers
│   │   └── services/      # WebSocket manager
│   ├── alembic/           # Database migrations
│   └── tests/             # pytest async tests
├── frontend/
│   └── src/
│       ├── components/    # TicketCard, Column, SecurityPanel, Modals
│       ├── pages/         # Login, ApiKeys, Board
│       ├── stores/        # Zustand (auth, board state)
│       ├── hooks/         # WebSocket hook
│       └── lib/           # API client, TypeScript types
├── docker-compose.yml     # PG + Redis + Backend + Frontend
├── .github/workflows/     # GitHub Actions CI
└── .gitlab-ci.yml         # GitLab CI
```

## Running Tests

```bash
# Backend unit tests (requires running PostgreSQL)
cd backend
pip install -r requirements.txt
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/clawkanban_test \
  pytest tests/ -v

# Or run tests inside Docker
docker compose exec backend pytest tests/ -v
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql+asyncpg://postgres:postgres@db:5432/clawkanban` | PostgreSQL connection |
| `REDIS_URL` | See docker-compose.yml | Redis connection |
| `SECRET_KEY` | `change-me-in-production` | JWT signing key |
| `GOOGLE_CLIENT_ID` | — | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | — | Google OAuth client secret |
| `FERNET_KEY` | Auto-generated | Credential encryption key |

## License

MIT
