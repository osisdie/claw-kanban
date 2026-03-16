# Contributing to Claw Kanban

Thanks for your interest in contributing! Here's how to get started.

## Development Setup

```bash
# 1. Fork and clone the repo
git clone https://github.com/<your-fork>/claw-kanban.git
cd claw-kanban

# 2. Start services
docker compose up --build

# 3. Backend is at http://localhost:8005, frontend at http://localhost:5178
```

## Making Changes

1. Create a feature branch from `main`
2. Make your changes
3. Run backend tests: `docker compose exec backend pytest tests/ -v`
4. Ensure `npm run build` passes in the frontend
5. Open a Pull Request with a clear description

## Code Style

- **Backend**: Follow PEP 8. Use type hints. Async everywhere.
- **Frontend**: TypeScript strict mode. Functional components with hooks.

## Reporting Issues

Open a GitHub Issue with:
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Docker version)

## Areas We'd Love Help With

- Internationalization (i18n)
- Mobile-responsive layout improvements
- Additional OAuth providers (GitHub, Microsoft)
- Redis pub/sub for multi-instance WebSocket scaling
- Notification integrations (Slack, Discord webhooks)
