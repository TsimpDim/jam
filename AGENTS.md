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

## Testing

### Backend (Django)

**Where to write tests:** Place test files in `jam-api/<app>/tests/`. Each test module mirrors the source layout:
```
jam-api/
├── jam/tests/
│   ├── __init__.py
│   ├── test_models.py
│   ├── test_serializers.py
│   ├── test_views.py
│   ├── test_signals.py
│   ├── test_validators.py
│   └── test_utils.py
├── special/tests/
│   ├── __init__.py
│   ├── test_models.py
│   ├── test_serializers.py
│   ├── test_views.py
│   └── test_commands.py
├── auth/tests/
│   └── test_views.py
└── extapi/tests/
    └── test_views.py
```

**How to write backend tests:**
- Use Django's `TestCase` (from `django.test`).
- Use `APIClient` (from `rest_framework.test`) for view tests, with `force_authenticate(user=self.user)`.
- Use `call_command` from `django.core.management` for management command tests.
- Mock external services (`AwsClient`, `WebSearch`) with `unittest.mock.patch`.
- Use in-memory SQLite via `--settings=core.settings.test` (defined in `jam-api/core/settings/test.py`).
- Account for signal-created data (user creation triggers default profile, steps, and group).

**How to execute backend tests:**
```bash
# Run all backend tests
docker exec jobappman-api python manage.py test jam auth special extapi --settings=core.settings.test

# Run a single test class
docker exec jobappman-api python manageystone test jam.tests.test_views.LeadViewSetTest --settings=core.settings.test

# Run a single test method
docker exec jobappman-api python manage.py test jam.tests.test_models.LeadModelTest.test_create_lead --settings=core.settings.test

# Test shortcut via ctrl.sh
./scripts/ctrl.sh test api
```

### Frontend (Angular)

**Where to write tests:** Place spec files next to the source file they test (Angular convention):
```
jam-client/src/app/
├── core/
│   ├── api/
│   │   ├── jam.service.ts
│   │   ├── jam.service.spec.ts          # API call tests with HttpTestingController
│   │   └── special.service.ts
│   └── services/
│       ├── auth.service.ts
│       ├── auth.service.spec.ts          # Login/register/session state
│       ├── notification.service.spec.ts  # Polling, signals, mark-as-read, filters
│       └── theme.service.spec.ts         # localStorage persistence, dark mode
├── shared/
│   ├── header/
│   │   ├── header.component.ts
│   │   ├── header.component.spec.ts     # Mobile menu toggle, auth visibility
│   │   └── header.component.html
│   ├── job-nav/
│   │   ├── job-nav.component.ts
│   │   ├── job-nav.component.spec.ts    # Reorder, search, sort, localStorage
│   │   └── job-nav.component.html
│   └── notification-bell/
│       ├── notification-bell.component.ts
│       ├── notification-bell.component.spec.ts  # Click to read, keyboard, open/close
│       └── notification-bell.component.html
├── modals/
│   ├── confirm-modal/
│   │   ├── confirm-modal.component.spec.ts  # Emit confirmed/cancelled, ESC/backdrop
│   ├── cv-upload-modal/
│   │   ├── cv-upload-modal.component.spec.ts  # File validators (.pdf/.doc/.docx, size)
│   └── lead-generation-modal/
│       └── lead-generation-modal-validators.spec.ts  # Form validators (countries, roles, etc.)
├── pages/
│   ├── applications/
│   │   ├── applications.component.spec.ts  # Delete confirmation, sort, notes
│   ├── leads/
│   │   ├── leads.component.spec.ts          # Filters, delete confirmation, form validation
│   └── auth/register/
│       └── register.component.spec.ts       # Password match/minlength, email format
```

**How to write frontend tests (Angular 19+ / standalone components):**
- **Always use standalone components** — `imports: [ComponentUnderTest]`, never `declarations`.
- **Use modern providers** — `provideHttpClient()`, `provideHttpClientTesting()` (not `HttpClientTestingModule`), `provideRouter([])` (not `RouterTestingModule`), `provideNoopAnimations()` (for Clarity components).
- **Spy on services** with `jasmine.createSpyObj` and pass via providers.
- **Spy on localStorage** directly with `spyOn(localStorage, 'getItem')`.
- **Use signals** in service mocks: expose readonly signal properties on the spy object via the third arg of `createSpyObj`.
- **Use `provideNoopAnimations()`** when testing any component that renders Clarity `clr-modal` or other animated elements (prevents `Unexpected synthetic listener` errors).

Example pattern for component tests:
```typescript
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

await TestBed.configureTestingModule({
  imports: [ComponentUnderTest],
  providers: [
    provideNoopAnimations(),
    provideHttpClient(),
    provideHttpClientTesting(),
    provideRouter([]),
    { provide: MyService, useValue: myServiceSpy },
  ],
}).compileComponents();
```

**How to execute frontend tests:**
```bash
# Run all frontend tests (inside running Docker container)
docker exec jobappman-client ng test --no-watch --browsers=ChromeHeadless

# Run a single spec file
docker exec jobappman-client npx ng test --no-watch --browsers=ChromeHeadless --include='**/header.component.spec.ts'

# Watch mode (leave container running with test runner)
docker exec -it jobappman-client ng test --browsers=ChromeHeadless

# Run on host (requires Chrome installed locally)
npx ng test --no-watch --browsers=ChromeHeadless
```
