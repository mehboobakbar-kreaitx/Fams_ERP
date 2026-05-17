# FAMS — Falcon Academic Management System

Enterprise ERP for a 31-campus college network built with ASP.NET Core 8, React 18, and PostgreSQL.

## Prerequisites

| Tool | Min Version | Download |
|---|---|---|
| Docker Desktop | 24.0 | https://www.docker.com/products/docker-desktop/ |
| Docker Compose | 2.20 | Bundled with Docker Desktop |
| .NET SDK 8 | 8.0 | https://dotnet.microsoft.com/download/dotnet/8.0 |
| Node.js | 20 LTS | https://nodejs.org/en/download/ |
| Git | 2.40 | https://git-scm.com/downloads |

Run the prerequisites check:
```powershell
.\check-prerequisites.ps1
```

---

## One-Command Local Setup

```bash
# 1. Clone the repo
git clone https://github.com/raideit/fams.git
cd fams

# 2. Copy environment file and fill in API keys
cp .env.example .env

# 3. Start everything
docker compose up -d

# 4. Wait ~30 seconds, then open:
```

| Service | URL |
|---|---|
| Frontend (main entry) | http://localhost:8080 |
| API Swagger | http://localhost:5000/swagger |
| Hangfire Dashboard | http://localhost:5000/hangfire |
| Seq Logs | http://localhost:8081 |
| MinIO Console | http://localhost:9001 |
| Grafana | http://localhost:3001 |
| Prometheus | http://localhost:9090 |

**Default superadmin credentials (development only):**
- Email: `superadmin@fams.io`
- Password: `SuperAdmin@2026!`

> ⚠️ Change these credentials before any staging or production deployment.

---

## Running Without Docker (Development)

Use Docker only for infrastructure (Postgres, Redis, MinIO, Seq) and run the app locally for faster hot reload.

```bash
# Start only infrastructure
docker compose up -d postgres redis minio seq

# Run API
cd FAMS.API
dotnet run

# Run frontend (in a second terminal)
cd frontend
npm install
npm run dev
```

The API runs at `http://localhost:5000`, frontend at `http://localhost:3000`.

---

## Database Migrations

```bash
# Add a migration (from solution root)
dotnet ef migrations add InitialCreate --project FAMS.Infrastructure --startup-project FAMS.API

# Apply migrations
dotnet ef database update --project FAMS.Infrastructure --startup-project FAMS.API
```

---

## Environment Variables Reference

| Variable | Type | Required | Description |
|---|---|---|---|
| `POSTGRES_DB` | string | Yes | PostgreSQL database name |
| `POSTGRES_USER` | string | Yes | PostgreSQL username |
| `POSTGRES_PASSWORD` | string | Yes | PostgreSQL password |
| `JWT_SECRET_KEY` | string | Yes | Min 32 chars — signs JWT tokens |
| `JWT_ISSUER` | string | Yes | JWT token issuer URL |
| `JWT_AUDIENCE` | string | Yes | JWT audience identifier |
| `MINIO_ROOT_USER` | string | Yes | MinIO admin username |
| `MINIO_ROOT_PASSWORD` | string | Yes | MinIO admin password |
| `ANTHROPIC_API_KEY` | string | No | Claude AI API key for chatbot |
| `SMTP_HOST` | string | No | SMTP server for emails |
| `SMTP_PASSWORD` | string | No | SMTP password |
| `TWILIO_ACCOUNT_SID` | string | No | Twilio SID for SMS |
| `TWILIO_AUTH_TOKEN` | string | No | Twilio auth token |
| `JAZZCASH_MERCHANT_ID` | string | No | JazzCash merchant ID |
| `GRAFANA_ADMIN_PASSWORD` | string | Yes | Grafana admin password |
| `CORS_ALLOWED_ORIGINS` | string | Yes | Comma-separated allowed origins |

---

## Architecture Overview

```
Browser → YARP Gateway (:8080)
              ├── /api/*        → ASP.NET Core API (:5000)
              ├── /hubs/*       → SignalR (:5000)
              ├── /swagger      → Swagger UI (:5000)
              └── /*            → React SPA (Nginx :80)

ASP.NET Core API (:5000)
  ├── PostgreSQL 16 (:5432)  — primary data store
  ├── Redis 7 (:6379)        — caching & sessions
  ├── MinIO (:9000)          — file storage (S3-compatible)
  ├── Seq (:5341)            — structured logs
  └── Hangfire               — background jobs (PostgreSQL-backed)

Monitoring
  ├── Prometheus (:9090)     — metrics scraping from /metrics
  └── Grafana (:3001)        — dashboards (Prometheus datasource)
```

### C# Project Layout

| Project | Role |
|---|---|
| `FAMS.Domain` | Entities, enums, value objects — no dependencies |
| `FAMS.Application` | CQRS commands/queries, MediatR, FluentValidation |
| `FAMS.Infrastructure` | EF Core, Identity, Redis, MinIO, Email, Hangfire |
| `FAMS.API` | ASP.NET Core entry point, controllers, JWT, SignalR |
| `FAMS.Gateway` | YARP reverse proxy |

---

## Module Structure

### Adding a new feature — example: `GetStudentById`

**1. Add a query in `FAMS.Application/Modules/CRM/`:**
```csharp
public record GetStudentByIdQuery(Guid Id) : IRequest<StudentDto>;

public class GetStudentByIdHandler : IRequestHandler<GetStudentByIdQuery, StudentDto>
{
    private readonly IFamsDbContext _db;
    public GetStudentByIdHandler(IFamsDbContext db) => _db = db;

    public async Task<StudentDto> Handle(GetStudentByIdQuery request, CancellationToken ct)
    {
        var student = await _db.Students.FindAsync([request.Id], ct)
            ?? throw new NotFoundException(nameof(Student), request.Id);
        return new StudentDto(student.Id, student.FullName, student.Email);
    }
}
```

**2. Add a controller action in `FAMS.API/Controllers/`:**
```csharp
[HttpGet("{id}")]
public async Task<ActionResult<StudentDto>> GetById(Guid id)
    => Ok(await _mediator.Send(new GetStudentByIdQuery(id)));
```

The MediatR pipeline automatically runs `ValidationBehavior` and `LoggingBehavior` for every request.

---

## Deployment

### Build and push Docker images
```bash
docker build -t ghcr.io/your-org/fams-api:latest -f FAMS.API/Dockerfile .
docker push ghcr.io/your-org/fams-api:latest

docker build -t ghcr.io/your-org/fams-frontend:latest ./frontend
docker push ghcr.io/your-org/fams-frontend:latest
```

### Deploy to Azure Container Apps
```bash
az containerapp update \
  --name fams-api \
  --resource-group fams-rg \
  --image ghcr.io/your-org/fams-api:latest
```

CI/CD pipeline (`.github/workflows/ci.yml`) automatically builds and pushes on every push to `main`.

---

## Port Map

| Service | Port | URL |
|---|---|---|
| YARP Gateway | 8080 | http://localhost:8080 |
| ASP.NET Core API | 5000 | http://localhost:5000 |
| PostgreSQL | 5432 | localhost:5432 |
| Redis | 6379 | localhost:6379 |
| MinIO API | 9000 | http://localhost:9000 |
| MinIO Console | 9001 | http://localhost:9001 |
| Seq | 8081 | http://localhost:8081 |
| Prometheus | 9090 | http://localhost:9090 |
| Grafana | 3001 | http://localhost:3001 |
