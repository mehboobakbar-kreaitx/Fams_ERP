# FAMS — Master Environment Setup Prompt

> Copy this entire prompt and paste it into Claude (or your AI coding assistant) to fully scaffold and configure the FAMS development environment on a local machine.

---

## THE PROMPT

---

You are a senior full-stack .NET engineer setting up the complete local development environment for the **Falcon Academic Management System (FAMS)** — an enterprise ERP for a 31-campus college network.

Your job is to generate every file, command, and configuration needed so a developer can run the full stack locally with a single command: `docker compose up`.

---

## SYSTEM CONTEXT

**System:** Falcon Academic Management System (FAMS)  
**Architecture:** Modular Monolith with Clean Architecture + CQRS  
**Backend:** ASP.NET Core 8 Web API (C# 12)  
**Frontend:** React 18 + Vite + TypeScript + Tailwind CSS  
**Database:** PostgreSQL 16 with Row-Level Security (campus_id isolation)  
**Cache:** Redis 7  
**File Storage:** MinIO (S3-compatible, local)  
**Gateway:** YARP Reverse Proxy  
**Real-time:** ASP.NET SignalR  
**Jobs:** Hangfire (PostgreSQL-backed)  
**Auth:** ASP.NET Core Identity + JWT Bearer + TOTP MFA  
**ORM:** Entity Framework Core 8 + Npgsql  
**PDF:** QuestPDF  
**Logging:** Serilog → Seq  
**Monitoring:** Prometheus + Grafana  
**Deployment:** Docker + Docker Compose (local), Azure-ready  

---

## TASK 1 — PREREQUISITES CHECK SCRIPT

Generate a shell script `check-prerequisites.sh` (cross-platform: Bash for Linux/Mac, PowerShell for Windows) that checks and installs all required tools:

- Docker Desktop (version ≥ 24)
- Docker Compose (version ≥ 2.20)
- .NET SDK 8.0
- Node.js 20 LTS
- Git
- VS Code (optional, with recommended extensions list)

The script must:
1. Check if each tool is installed
2. Print the installed version if found
3. Print a clear install instruction (with the official download URL) if not found
4. Print a final summary: ✅ Ready / ❌ Missing tools
5. Work on Windows (PowerShell), macOS, and Ubuntu/Debian Linux

---

## TASK 2 — FULL PROJECT FOLDER STRUCTURE

Scaffold the complete folder structure for the FAMS solution. Use this exact layout:

```
fams/
├── docker-compose.yml
├── docker-compose.override.yml
├── .env.example
├── .gitignore
├── README.md
│
├── src/
│   ├── FAMS.API/                          ← ASP.NET Core 8 Web API (entry point)
│   │   ├── FAMS.API.csproj
│   │   ├── Program.cs
│   │   ├── appsettings.json
│   │   ├── appsettings.Development.json
│   │   ├── Dockerfile
│   │   ├── Controllers/
│   │   │   └── HealthController.cs
│   │   └── Extensions/
│   │       ├── ServiceExtensions.cs
│   │       └── MiddlewareExtensions.cs
│   │
│   ├── FAMS.Application/                  ← CQRS commands, queries, interfaces
│   │   ├── FAMS.Application.csproj
│   │   ├── Common/
│   │   │   ├── Behaviors/
│   │   │   │   ├── ValidationBehavior.cs
│   │   │   │   └── LoggingBehavior.cs
│   │   │   └── Interfaces/
│   │   │       ├── ICurrentUserService.cs
│   │   │       └── IDateTime.cs
│   │   └── Modules/
│   │       ├── CRM/
│   │       ├── Admissions/
│   │       ├── Academic/
│   │       ├── Results/
│   │       ├── Finance/
│   │       ├── HRM/
│   │       ├── Procurement/
│   │       └── Assets/
│   │
│   ├── FAMS.Domain/                       ← Domain entities, enums, value objects
│   │   ├── FAMS.Domain.csproj
│   │   ├── Common/
│   │   │   └── BaseEntity.cs
│   │   └── Entities/
│   │       ├── Student.cs
│   │       ├── Staff.cs
│   │       ├── Campus.cs
│   │       └── ...
│   │
│   ├── FAMS.Infrastructure/               ← EF Core, Redis, MinIO, Email, SMS
│   │   ├── FAMS.Infrastructure.csproj
│   │   ├── Persistence/
│   │   │   ├── FamsDbContext.cs
│   │   │   ├── Migrations/
│   │   │   └── Configurations/
│   │   ├── Identity/
│   │   │   └── ApplicationUser.cs
│   │   ├── Services/
│   │   │   ├── EmailService.cs
│   │   │   ├── SmsService.cs
│   │   │   ├── StorageService.cs
│   │   │   └── AiChatbotService.cs
│   │   └── Jobs/
│   │       └── HangfireJobService.cs
│   │
│   └── FAMS.Gateway/                      ← YARP reverse proxy
│       ├── FAMS.Gateway.csproj
│       ├── Program.cs
│       └── appsettings.json
│
├── frontend/                              ← React 18 + Vite + TypeScript
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── index.html
│   ├── Dockerfile
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── api/
│       ├── components/
│       ├── pages/
│       │   ├── Login.tsx
│       │   └── Dashboard.tsx
│       ├── hooks/
│       └── store/
│
├── tests/
│   ├── FAMS.UnitTests/
│   │   └── FAMS.UnitTests.csproj
│   ├── FAMS.IntegrationTests/
│   │   └── FAMS.IntegrationTests.csproj
│   └── FAMS.E2ETests/
│       └── playwright.config.ts
│
├── infra/
│   ├── terraform/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   └── k8s/
│       ├── deployment.yml
│       └── service.yml
│
└── docs/
    ├── FAMS_Complete_Document.md
    └── api/
        └── openapi.json
```

Create all folders and generate placeholder files with proper content (not empty).

---

## TASK 3 — DOCKER COMPOSE (FULL STACK)

Generate a complete `docker-compose.yml` that starts all services with a single `docker compose up`:

### Services to include:

**fams-api** (ASP.NET Core 8)
- Build from `./src/FAMS.API/Dockerfile`
- Port: 5000 (internal), 5000 (host)
- Environment variables from `.env`
- Depends on: postgres, redis, minio, seq
- Health check: `GET /health`
- Restart policy: `unless-stopped`

**fams-gateway** (YARP)
- Build from `./src/FAMS.Gateway/Dockerfile`
- Port: 8080 (host-facing entry point for all traffic)
- Routes all `/api/*` to `fams-api`, all other to `fams-frontend`

**fams-frontend** (React + Nginx)
- Build from `./frontend/Dockerfile` (multi-stage: Node build → Nginx serve)
- Port: 3000 (internal)

**postgres** (PostgreSQL 16)
- Image: `postgres:16-alpine`
- Port: 5432
- Volume: `postgres_data`
- Init script: creates `fams` database, enables `pgcrypto`, sets up `campus_id` RLS functions

**redis** (Redis 7)
- Image: `redis:7-alpine`
- Port: 6379
- Persistence: AOF enabled
- Volume: `redis_data`

**minio** (MinIO — S3-compatible storage)
- Image: `minio/minio:latest`
- Ports: 9000 (API), 9001 (Console)
- Volume: `minio_data`
- Command: `server /data --console-address ":9001"`
- Creates buckets: `fams-documents`, `fams-exports`, `fams-avatars`

**hangfire-dashboard** (exposed via fams-api, no separate service needed — note this)

**seq** (Structured log viewer)
- Image: `datalust/seq:latest`
- Port: 5341 (ingestion), 8081 (UI)
- Volume: `seq_data`
- Environment: `ACCEPT_EULA=Y`

**prometheus** (Metrics collection)
- Image: `prom/prometheus:latest`
- Port: 9090
- Config: `./infra/prometheus.yml`
- Scrapes: `fams-api:5000/metrics`

**grafana** (Metrics dashboards)
- Image: `grafana/grafana:latest`
- Port: 3001
- Volume: `grafana_data`
- Pre-configured datasource: Prometheus
- Pre-loaded dashboard: ASP.NET Core overview

Also generate `docker-compose.override.yml` for development-specific settings (hot reload, debug ports, verbose logging).

---

## TASK 4 — .ENV FILE

Generate `.env.example` with every environment variable the stack needs, with comments explaining each one:

```env
# ── Database ──────────────────────────────────────────────────────────────
POSTGRES_DB=fams
POSTGRES_USER=fams_user
POSTGRES_PASSWORD=change_me_in_production
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
CONNECTION_STRING=Host=postgres;Port=5432;Database=fams;Username=fams_user;Password=change_me_in_production

# ── Redis ─────────────────────────────────────────────────────────────────
REDIS_CONNECTION=redis:6379

# ── MinIO / S3 ────────────────────────────────────────────────────────────
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=change_me_in_production
MINIO_ENDPOINT=http://minio:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=change_me_in_production
MINIO_BUCKET_DOCUMENTS=fams-documents
MINIO_BUCKET_EXPORTS=fams-exports
MINIO_BUCKET_AVATARS=fams-avatars

# ── JWT Auth ──────────────────────────────────────────────────────────────
JWT_SECRET_KEY=replace_with_32_plus_character_random_string
JWT_ISSUER=https://fams.falcon-college.edu.pk
JWT_AUDIENCE=fams-api
JWT_ACCESS_TOKEN_EXPIRY_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRY_DAYS=7

# ── ASP.NET Core ──────────────────────────────────────────────────────────
ASPNETCORE_ENVIRONMENT=Development
ASPNETCORE_URLS=http://+:5000

# ── Logging (Seq) ─────────────────────────────────────────────────────────
SEQ_URL=http://seq:5341
SEQ_API_KEY=

# ── AI Chatbot (Anthropic Claude) ─────────────────────────────────────────
ANTHROPIC_API_KEY=sk-ant-your-key-here
ANTHROPIC_MODEL=claude-sonnet-4-20250514

# ── SMS Gateway (Twilio) ──────────────────────────────────────────────────
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_FROM_NUMBER=+1234567890

# ── Email (MailKit / SMTP) ────────────────────────────────────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=noreply@falcon-college.edu.pk
SMTP_PASSWORD=your_app_password
SMTP_FROM_NAME=FAMS — Falcon College

# ── Payment Gateway (JazzCash) ────────────────────────────────────────────
JAZZCASH_MERCHANT_ID=your_merchant_id
JAZZCASH_PASSWORD=your_jazzcash_password
JAZZCASH_INTEGRITY_SALT=your_integrity_salt
JAZZCASH_API_URL=https://sandbox.jazzcash.com.pk/ApplicationAPI/API/2.0/Purchase

# ── CORS ──────────────────────────────────────────────────────────────────
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080

# ── Hangfire ──────────────────────────────────────────────────────────────
HANGFIRE_DASHBOARD_USER=admin
HANGFIRE_DASHBOARD_PASSWORD=change_me_in_production

# ── Monitoring ────────────────────────────────────────────────────────────
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=change_me_in_production
```

---

## TASK 5 — ASP.NET CORE API PROJECT FILES

Generate the following fully working files:

### `src/FAMS.API/Program.cs`
Complete `Program.cs` that:
- Configures Serilog with Seq sink
- Registers MediatR (scanning FAMS.Application)
- Registers FluentValidation (scanning FAMS.Application)
- Registers AutoMapper
- Registers EF Core with PostgreSQL (Npgsql)
- Registers Redis (StackExchange.Redis)
- Configures ASP.NET Core Identity
- Configures JWT Bearer authentication
- Configures policy-based authorization (roles: SystemAdmin, Principal, Teacher, Student, Parent, Accountant, HrOfficer, ProcurementOfficer, AcademicCoordinator, Executive)
- Registers Hangfire with PostgreSQL storage
- Registers Hangfire Server
- Registers YARP routes (or notes this is in the Gateway project)
- Registers SignalR
- Registers Prometheus metrics (`UseHttpMetrics()`, `MapMetrics()`)
- Configures Swagger / OpenAPI with JWT bearer support
- Configures CORS from environment variable
- Registers MinIO client (AWSSDK.S3 or Minio .NET SDK)
- Maps all controllers
- Maps SignalR hubs
- Maps Hangfire Dashboard at `/hangfire` (admin only)
- Maps health checks at `/health`

### `src/FAMS.API/appsettings.json`
Full appsettings with all configuration sections (ConnectionStrings, Jwt, Redis, Minio, Seq, Hangfire, Smtp, Twilio, JazzCash, Anthropic, Cors) — values read from environment variables using the `${VAR_NAME}` pattern or direct binding.

### `src/FAMS.API/Dockerfile`
Multi-stage Dockerfile:
- Stage 1: `mcr.microsoft.com/dotnet/sdk:8.0` — restore, build, publish
- Stage 2: `mcr.microsoft.com/dotnet/aspnet:8.0` — runtime only, non-root user
- Expose port 5000
- ENTRYPOINT for the published dll

### `src/FAMS.Infrastructure/Persistence/FamsDbContext.cs`
Complete `FamsDbContext` that:
- Inherits from `IdentityDbContext<ApplicationUser>`
- Has `DbSet<>` for: Student, Staff, Campus, AuditLog, and placeholder DbSets for each module
- Overrides `OnModelCreating` to apply all IEntityTypeConfiguration classes from the assembly
- Overrides `SaveChangesAsync` to auto-set `CreatedAt`, `UpdatedAt`, `campus_id` from current user context
- Sets up global query filters for soft-delete and campus-scoped tenancy

### `src/FAMS.Domain/Common/BaseEntity.cs`
```csharp
public abstract class BaseEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CampusId { get; set; }           // Tenant discriminator
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public bool IsDeleted { get; set; }          // Soft delete
}
```

### `src/FAMS.Domain/Entities/Student.cs`
Full Student entity with all fields from PRD FR-CRM-01:
- Personal info (FirstName, LastName, DateOfBirth, Gender, NIC/BFORM, Photo)
- Contact (Address, Phone, Email)
- Emergency contact
- Medical notes
- Enrollment status enum (Prospect, Applicant, Enrolled, Active, Graduated, Withdrawn)
- Navigation properties to Parent, Campus, Results, Attendance, FeeInvoices

### `src/FAMS.Infrastructure/Identity/ApplicationUser.cs`
Extended IdentityUser with:
- FirstName, LastName
- CampusId (Guid — scopes the user to a campus)
- ProfilePhoto
- LastLoginAt
- IsActive

---

## TASK 6 — FRONTEND PROJECT FILES

Generate the following React files:

### `frontend/package.json`
With exact versions for:
- react@18, react-dom@18
- typescript@5
- vite@5
- @vitejs/plugin-react
- tailwindcss@3, postcss, autoprefixer
- @tanstack/react-query@5
- axios@1
- react-router-dom@6
- recharts@2
- @microsoft/signalr (for SignalR real-time)
- lucide-react (icons)
- shadcn/ui dependencies (@radix-ui/react-*)
- Dev: @types/react, @types/react-dom, eslint, prettier, playwright

### `frontend/vite.config.ts`
With:
- React plugin
- Proxy: `/api` → `http://localhost:5000`
- Proxy: `/hubs` → `http://localhost:5000` (WebSocket)
- Path aliases: `@/` → `src/`

### `frontend/tailwind.config.ts`
With content paths, FAMS brand colors (primary blue: `#1B4F8A`, secondary: `#2E75B6`), and shadcn/ui preset.

### `frontend/src/api/axiosClient.ts`
Configured Axios instance with:
- Base URL from env (`VITE_API_URL`)
- Request interceptor: injects JWT from localStorage
- Response interceptor: handles 401 → calls refresh token → retries request → redirects to login if refresh fails

### `frontend/src/App.tsx`
With React Router setup, protected routes (checks JWT), role-based route guards, and lazy-loaded page components for each module.

### `frontend/Dockerfile`
Multi-stage:
- Stage 1: `node:20-alpine` — install deps, build Vite
- Stage 2: `nginx:alpine` — serve dist folder
- Custom `nginx.conf` that:
  - Serves the React SPA
  - Falls back to `index.html` for client-side routing (SPA fallback)
  - Proxies `/api` to `fams-api:5000`

---

## TASK 7 — DATABASE INITIALIZATION

Generate `infra/postgres/init.sql` that runs on first container start:

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create application schema
CREATE SCHEMA IF NOT EXISTS fams;

-- RLS helper function: get current campus_id from session variable
CREATE OR REPLACE FUNCTION current_campus_id() RETURNS UUID AS $$
  SELECT NULLIF(current_setting('app.campus_id', true), '')::UUID;
$$ LANGUAGE sql STABLE;

-- Create campuses seed data
INSERT INTO fams."Campuses" ("Id", "Name", "Code", "City", "IsActive", "CreatedAt", "UpdatedAt")
VALUES
  (gen_random_uuid(), 'Main Campus', 'MC-01', 'Karachi', true, NOW(), NOW()),
  (gen_random_uuid(), 'North Campus', 'NC-01', 'Lahore', true, NOW(), NOW()),
  (gen_random_uuid(), 'South Campus', 'SC-01', 'Islamabad', true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- System admin seed user (password will be hashed by the API on first run)
-- See seed script in src/FAMS.Infrastructure/Persistence/DbSeeder.cs
```

Also generate `src/FAMS.Infrastructure/Persistence/DbSeeder.cs` that:
- Seeds default roles (SystemAdmin, Principal, Teacher, Student, Parent, Accountant, HrOfficer, ProcurementOfficer, AcademicCoordinator, Executive)
- Seeds a default System Administrator user (email: `admin@fams.local`, password: `Admin@12345!`) — password must be hashed using ASP.NET Core Identity's `PasswordHasher`
- Seeds 3 sample campuses matching the SQL above
- Only runs if the database is empty (idempotent)
- Called from `Program.cs` on startup in Development environment

---

## TASK 8 — NUGET PACKAGES LIST

Generate the complete `.csproj` file for each project with all required NuGet packages and exact versions:

### `src/FAMS.API/FAMS.API.csproj`
```xml
<PackageReference Include="Microsoft.AspNetCore.Authentication.JwtBearer" Version="8.*" />
<PackageReference Include="Microsoft.AspNetCore.Identity.EntityFrameworkCore" Version="8.*" />
<PackageReference Include="Swashbuckle.AspNetCore" Version="6.*" />
<PackageReference Include="Yarp.ReverseProxy" Version="2.*" />
<PackageReference Include="Hangfire.AspNetCore" Version="1.*" />
<PackageReference Include="Hangfire.PostgreSql" Version="1.*" />
<PackageReference Include="Serilog.AspNetCore" Version="8.*" />
<PackageReference Include="Serilog.Sinks.Seq" Version="7.*" />
<PackageReference Include="prometheus-net.AspNetCore" Version="8.*" />
<PackageReference Include="Microsoft.AspNetCore.SignalR" Version="1.*" />
<PackageReference Include="QuestPDF" Version="2024.*" />
<PackageReference Include="Audit.NET" Version="27.*" />
<PackageReference Include="Audit.EntityFramework.Core" Version="27.*" />
```

### `src/FAMS.Application/FAMS.Application.csproj`
```xml
<PackageReference Include="MediatR" Version="12.*" />
<PackageReference Include="FluentValidation.DependencyInjectionExtensions" Version="11.*" />
<PackageReference Include="AutoMapper" Version="13.*" />
<PackageReference Include="AutoMapper.Extensions.Microsoft.DependencyInjection" Version="12.*" />
```

### `src/FAMS.Infrastructure/FAMS.Infrastructure.csproj`
```xml
<PackageReference Include="Microsoft.EntityFrameworkCore" Version="8.*" />
<PackageReference Include="Npgsql.EntityFrameworkCore.PostgreSQL" Version="8.*" />
<PackageReference Include="StackExchange.Redis" Version="2.*" />
<PackageReference Include="AWSSDK.S3" Version="3.*" />
<PackageReference Include="MailKit" Version="4.*" />
<PackageReference Include="Twilio" Version="7.*" />
<PackageReference Include="Polly" Version="8.*" />
<PackageReference Include="NodaTime" Version="3.*" />
<PackageReference Include="ClosedXML" Version="0.*" />
<PackageReference Include="Sustainsys.Saml2.AspNetCore2" Version="2.*" />
<PackageReference Include="Microsoft.AspNetCore.Identity.EntityFrameworkCore" Version="8.*" />
```

### `tests/FAMS.UnitTests/FAMS.UnitTests.csproj`
```xml
<PackageReference Include="xunit" Version="2.*" />
<PackageReference Include="Moq" Version="4.*" />
<PackageReference Include="FluentAssertions" Version="6.*" />
<PackageReference Include="Microsoft.NET.Test.Sdk" Version="17.*" />
<PackageReference Include="xunit.runner.visualstudio" Version="2.*" />
```

### `tests/FAMS.IntegrationTests/FAMS.IntegrationTests.csproj`
```xml
<PackageReference Include="Microsoft.AspNetCore.Mvc.Testing" Version="8.*" />
<PackageReference Include="Testcontainers.PostgreSql" Version="3.*" />
<PackageReference Include="Testcontainers.Redis" Version="3.*" />
<PackageReference Include="xunit" Version="2.*" />
<PackageReference Include="FluentAssertions" Version="6.*" />
```

---

## TASK 9 — GITHUB ACTIONS CI/CD PIPELINE

Generate `.github/workflows/ci.yml` that:

1. **Triggers** on: push to `main` and `develop`, pull requests to `main`
2. **Jobs:**

   **build-and-test:**
   - Runs on: `ubuntu-latest`
   - Steps:
     - Checkout code
     - Setup .NET 8 SDK
     - Setup Node.js 20
     - Restore NuGet packages
     - Build solution (`dotnet build --no-restore`)
     - Run unit tests (`dotnet test FAMS.UnitTests --no-build --collect:"XPlat Code Coverage"`)
     - Run integration tests (spins up Testcontainers — needs Docker)
     - Upload coverage to SonarCloud (or Codecov)
     - Build frontend (`cd frontend && npm ci && npm run build`)
     - Run ESLint

   **docker-build:**
   - Needs: build-and-test
   - Only on push to `main`
   - Build API Docker image
   - Build frontend Docker image
   - Tag with git SHA
   - Push to GitHub Container Registry (GHCR)

   **deploy-staging (optional):**
   - Needs: docker-build
   - Placeholder step for Azure Container Apps deployment using `az containerapp update`

---

## TASK 10 — VS CODE WORKSPACE

Generate `.vscode/extensions.json` recommending:
- `ms-dotnettools.csdevkit` (C# Dev Kit)
- `ms-dotnettools.csharp`
- `dbaeumer.vscode-eslint`
- `esbenp.prettier-vscode`
- `bradlc.vscode-tailwindcss`
- `ms-azuretools.vscode-docker`
- `humao.rest-client` (for API testing)
- `eamodio.gitlens`

Generate `.vscode/launch.json` with launch configurations for:
- **FAMS API (local)** — `dotnet run` on FAMS.API
- **FAMS Frontend (local)** — launches Vite dev server
- **Full Stack (Docker)** — attaches debugger to the running Docker container

Generate `.vscode/tasks.json` with tasks:
- `docker-up` — runs `docker compose up -d`
- `docker-down` — runs `docker compose down`
- `ef-migrate` — runs `dotnet ef migrations add` with prompts
- `ef-update` — runs `dotnet ef database update`
- `run-tests` — runs all xUnit tests

---

## TASK 11 — QUICK-START README

Generate a complete `README.md` with these sections:

### Prerequisites
List every tool with minimum version and download link

### One-Command Local Setup
```bash
# 1. Clone the repo
git clone https://github.com/raideit/fams.git
cd fams

# 2. Copy environment file
cp .env.example .env
# Edit .env and fill in your API keys

# 3. Start everything
docker compose up -d

# 4. Wait ~30 seconds, then open:
# Frontend:          http://localhost:8080
# API Swagger:       http://localhost:5000/swagger
# Hangfire Dashboard:http://localhost:5000/hangfire
# Seq Logs:          http://localhost:8081
# MinIO Console:     http://localhost:9001
# Grafana:           http://localhost:3001
# Prometheus:        http://localhost:9090

# 5. Default admin credentials:
# Email: admin@fams.local
# Password: Admin@12345!
# (Change immediately after first login)
```

### Running Without Docker (Development)
Step-by-step instructions for running the API and frontend locally without Docker (for faster hot reload development), still using Docker for Postgres/Redis/MinIO.

### Running Database Migrations
```bash
cd src/FAMS.API
dotnet ef migrations add InitialCreate --project ../FAMS.Infrastructure
dotnet ef database update
```

### Environment Variables Reference
Full table of all variables from .env.example with type, required/optional, and description

### Architecture Overview
Brief explanation of each service and which port it runs on

### Module Structure
How to add a new feature following the Clean Architecture + CQRS pattern — with a concrete example (e.g., "Add a GetStudentById query")

### Deployment
Short section on how to push to Azure:
```bash
# Build and push images
docker build -t ghcr.io/your-org/fams-api:latest ./src/FAMS.API
docker push ghcr.io/your-org/fams-api:latest

# Deploy to Azure Container Apps (or App Service)
az containerapp update --name fams-api --resource-group fams-rg --image ghcr.io/your-org/fams-api:latest
```

---

## DELIVERY REQUIREMENTS

- Generate every file with **real, working content** — no placeholder comments like `// TODO: implement`
- All C# files must compile without errors
- All TypeScript files must be valid TypeScript
- Docker Compose must start cleanly on a fresh machine with no pre-existing data
- All ports must be unique and documented
- The `.env.example` must contain every variable the app needs
- The README must be complete enough for a new developer to get running in under 15 minutes
- Follow these naming conventions throughout:
  - C#: PascalCase for classes, camelCase for locals, `I` prefix for interfaces
  - TypeScript: PascalCase for components, camelCase for functions and variables
  - Database: PascalCase table names, snake_case column names in migrations

---

## PORT MAP SUMMARY (for reference)

| Service | Port | URL |
|---|---|---|
| YARP Gateway (main entry) | 8080 | http://localhost:8080 |
| ASP.NET Core API | 5000 | http://localhost:5000 |
| React Frontend (via Nginx) | 3000 | internal only |
| PostgreSQL | 5432 | localhost:5432 |
| Redis | 6379 | localhost:6379 |
| MinIO API | 9000 | http://localhost:9000 |
| MinIO Console | 9001 | http://localhost:9001 |
| Seq (logs) | 8081 | http://localhost:8081 |
| Prometheus | 9090 | http://localhost:9090 |
| Grafana | 3001 | http://localhost:3001 |
| Hangfire Dashboard | 5000/hangfire | http://localhost:5000/hangfire |
| Swagger / OpenAPI | 5000/swagger | http://localhost:5000/swagger |

---

Begin generating all files now. Start with Task 1 (prerequisites script), then proceed in order through Task 11. For each file, show the full path as a heading before the code block.
