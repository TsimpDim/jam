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

## Database Rules

### Never delete or mutate database data without explicit permission

Do not run `DELETE`, `DROP`, `TRUNCATE`, or ORM `.delete()` / `.update()` calls against the
database unless the user explicitly asks for it. This includes Django shell one-liners,
management commands, and raw SQL. Creating test data for validation is acceptable, but
always clean it up the same way — never by directly reaching into the database.

```bash
# BAD — never do this
docker exec jobappman-api bash -c '... Notification.objects.all().delete() ...'

# GOOD — ask the user first, or use a reversible approach (e.g. test fixtures)
```

### Never use two-way binding with Clarity components

Do not use `[(clrModalOpen)]`, `[(clrAlertClosed)]`, or any other `[(x)]` two-way binding.
This causes state desynchronization between parent and child components when modals/alerts
are closed via ESC or the X button — the Clarity component updates the child's `@Input()`
property internally, but the parent's state is never updated.

Instead, always use one-way `[x]` binding with an explicit `(xChange)` handler:

```html
<!-- BAD -->
<clr-modal [(clrModalOpen)]="isOpen">

<!-- GOOD -->
<clr-modal [clrModalOpen]="isOpen" (clrModalOpenChange)="onClrModalOpenChange($event)">
```

The handler should emit the parent's close event and clean up state:

```typescript
onClrModalOpenChange(open: boolean) {
  if (!open) {
    this.onClose.emit();
    this.resetState();
  }
}
```

For modal components, also ensure `ngOnChanges` re-initializes state when either
`isOpen` or the data input changes, to handle same-object reference reuse.

```typescript
ngOnChanges(changes: SimpleChanges) {
  if ((changes['isOpen'] || changes['data']) && this.isOpen && this.data) {
    // re-initialize state
  }
}
```
