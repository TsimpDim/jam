# JAM Project — Agent Instructions

## Django API Migrations

The Jam API runs inside a Docker container (`jobappman-api`). To create and apply migrations:

```bash
# Create migration (after model changes)
docker exec jobappman-api python manage.py makemigrations jam --settings=core.settings.full

# Apply all pending migrations
docker exec jobappman-api python manage.py migrate --settings=core.settings.full
```

Run both commands from `jam-api/`.

## Development Workflow

### Starting Services

The project uses a control script at `scripts/ctrl.sh`:

```bash
./scripts/ctrl.sh start core     # Database + Adminer
./scripts/ctrl.sh start api      # Django API (port 8001)
./scripts/ctrl.sh start client   # Angular client (port 81)
./scripts/ctrl.sh start all      # Start everything
```

### Service Access Points

| Service | URL | Credentials |
|---------|-----|-------------|
| Client (Dashboard) | http://localhost:81 | User login |
| API | http://localhost:8001 | Session auth |
| Extension API | http://localhost:8002 | Knox token |
| Adminer (DB Admin) | http://localhost:8081 | jam-db / root / root |
| Database | localhost:3307 | root / root |

### Key Commands

```bash
# Django shell
docker exec -it jobappman-api python manage.py shell --settings=core.settings.full

# View API logs
docker logs -f jobappman-api

# View client logs
docker logs -f jobappman-client

# Run Angular tests
docker exec jobappman-client ng test
```

## Tech Stack

- **Backend:** Django 4.2, DRF 3.16, MySQL, Knox auth
- **Frontend:** Angular 19.2, Clarity UI 17, Chart.js, D3.js
- **Infrastructure:** Docker Compose, Gunicorn
