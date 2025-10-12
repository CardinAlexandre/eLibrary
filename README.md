# eLibrary - Microservices Library Management Platform

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## 🎯 Overview

eLibrary is a modern library management platform built with a .NET microservices architecture, featuring dual frontend implementations (React & Angular) and a complete DevOps infrastructure.

### Architecture

```
┌─────────────┐     ┌─────────────┐
│   React     │     │  Angular    │
│  Frontend   │     │  Frontend   │
└──────┬──────┘     └──────┬──────┘
       │                   │
       └───────┬───────────┘
               │
        ┌──────▼───────┐
        │  API Gateway │
        │    (YARP)    │
        └──────┬───────┘
               │
    ┌──────────┼──────────────┐
    │          │              │
┌───▼───┐  ┌──▼───┐  ┌──────▼─────┐
│Catalog│  │ Auth │  │ Recommender│
└───┬───┘  └──────┘  └──────┬─────┘
    │                       │
┌───▼─────┐  ┌─────────┐ ┌───▼──────┐
│Importer │  │Analytics│ │ WebSocket│
└─────────┘  └─────────┘ └──────────┘
       │           │
    ┌──▼───────────▼──┐
    │   SQL Server    │
    │   RabbitMQ      │
    │   Redis Cache   │
    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- .NET 8.0 SDK
- Docker Desktop
- Node.js 20+ and npm
- Git
- PowerShell 7+ (for scripts)

### Installation

```bash
# Clone the repository
git clone https://github.com/elibrary/elibrary.git
cd elibrary

# Start the complete infrastructure
docker-compose up -d

# Apply migrations and seed data
docker-compose exec catalog-service dotnet run -- seed

# Access the applications
# React Frontend: http://localhost:3000
# Angular Frontend: http://localhost:4200
# API Gateway: http://localhost:5000
# Swagger: http://localhost:5000/swagger
# Grafana: http://localhost:3001 (admin/admin)
# Prometheus: http://localhost:9090
# RabbitMQ: http://localhost:15672 (guest/guest)
```

## 📦 Microservices

| Service | Port | Description |
|---------|------|-------------|
| **Gateway** | 5000 | Single entry point (YARP), JWT authentication |
| **Catalog** | 5001 | Catalog management (CRUD books, loans, reviews) |
| **Auth** | 5002 | Authentication and authorization (JWT) |
| **Importer** | 5003 | Import and enrichment via Google Books API |
| **Recommender** | 5004 | Content-based recommendation system |
| **Analytics** | 5005 | Statistics and admin dashboards |

## 🏗️ Patterns and Techniques

- **Architecture**: Microservices with DDD
- **Communication**: REST + RabbitMQ (events) + WebSocket
- **Patterns**: CQRS + Mediator (MediatR)
- **ORM**: Entity Framework Core with migrations
- **Validation**: FluentValidation
- **Logging**: Serilog (structured)
- **Caching**: Distributed Redis
- **Observability**: Prometheus + Grafana + OpenTelemetry
- **Testing**: xUnit (unit + integration)
- **CI/CD**: GitHub Actions

## 📚 Domain Model

Book inheritance hierarchy:

```csharp
Book (abstract)
├── PrintedBook (ISBN, pages, publisher)
├── EBook (format, fileSize, DRM)
└── AudioBook (duration, narrator, format)
```

## 🎨 Frontends

Two identical implementations with the same features:

### React + Redux Toolkit
- TypeScript
- Redux Toolkit (state management)
- Material UI + TailwindCSS
- React Router v6
- Tests: Jest + React Testing Library
- E2E: Cypress

### Angular + NgRx
- TypeScript
- NgRx (state management)
- Angular Material + TailwindCSS
- Angular Router
- Tests: Karma + Jasmine
- E2E: Playwright

### UI Features

- 📖 Book listing and advanced search
- 🔍 Multi-criteria filters (type, genre, language, availability)
- 📝 Book details with reviews and ratings
- 💬 Review and rating system
- 📥 Book import (JSON/CSV) with enrichment
- 📊 Admin dashboard (statistics, top books)
- 📚 Loan management
- 💡 Personalized recommendations
- 🔔 Real-time notifications (WebSocket)
- 🌓 Light/dark mode

## 🛠️ Development Commands

### Backend (.NET)

```bash
# Build all services
dotnet build

# Run tests
dotnet test

# Apply migrations
cd services/catalog-service
dotnet ef database update

# Format code
dotnet format

# Create a migration
dotnet ef migrations add MigrationName
```

### React Frontend

```bash
cd frontend/react
npm install
npm start          # Dev server
npm test           # Unit tests
npm run build      # Production build
npm run cypress    # E2E tests
npm run storybook  # Storybook UI
npm run lint       # ESLint
```

### Angular Frontend

```bash
cd frontend/angular
npm install
npm start          # Dev server
npm test           # Unit tests
npm run build      # Production build
npm run e2e        # Playwright E2E tests
npm run lint       # ESLint
```

## 🐳 Docker

```bash
# Build all services
docker-compose build

# Start in dev mode
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Service logs
docker-compose logs -f catalog-service

# Stop and clean up
docker-compose down -v
```

## 🌍 Terraform (Infrastructure as Code)

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

## 🔄 Git Workflow

### Branches

- `main` - Production
- `develop` - Development
- `feature/*` - New features
- `fix/*` - Bug fixes

### Workflow Example

```bash
# Create a feature branch
git checkout -b feature/add-audiobook-support

# Atomic commits
git add .
git commit -m "feat(catalog): add AudioBook EF configuration"
git commit -m "test(catalog): add AudioBook tests"

# Interactive rebase before PR
git checkout develop
git pull origin develop
git checkout feature/add-audiobook-support
git rebase -i develop

# Push and create PR
git push origin feature/add-audiobook-support
# Create PR on GitHub using template
```

### Commit Convention

- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Refactoring
- `test:` - Add/modify tests
- `docs:` - Documentation
- `chore:` - Miscellaneous tasks
- `perf:` - Performance optimization

## 📊 Monitoring and Observability

### Grafana Dashboards

Access at http://localhost:3001 (admin/admin)

- **eLibrary Overview**: Global metrics
- **Service Health**: Microservices status
- **API Performance**: Response time, error rate
- **Business Metrics**: Loans, imports, active users

### Prometheus Metrics

- Request rate & latency
- Error rate
- Database connection pool
- Cache hit ratio
- RabbitMQ queue depth

### Structured Logging (Serilog)

All logs are structured and sent to:
- Console (dev)
- Elasticsearch (staging/prod)
- File rolling (backup)

## 🧪 Testing

### Unit Tests

```bash
# .NET
dotnet test --collect:"XPlat Code Coverage"

# React
cd frontend/react && npm test -- --coverage

# Angular
cd frontend/angular && npm test -- --code-coverage
```

### Integration Tests

Integration tests use WebApplicationFactory and Testcontainers:

```bash
dotnet test --filter Category=Integration
```

### Performance Tests (K6)

```bash
cd tests/performance
k6 run load-test.js
```

## 📋 Main API Endpoints

### Catalog Service

```http
GET    /api/catalog/books              # Paginated list
GET    /api/catalog/books/{id}         # Details
POST   /api/catalog/books              # Create
PUT    /api/catalog/books/{id}         # Update
DELETE /api/catalog/books/{id}         # Delete
GET    /api/catalog/books/search?q=    # Full-text search
POST   /api/catalog/books/import       # Import JSON/CSV
GET    /api/catalog/loans              # Loan list
POST   /api/catalog/loans              # Create loan
PUT    /api/catalog/loans/{id}/return  # Return book
GET    /api/catalog/reviews            # Review list
POST   /api/catalog/reviews            # Add review
```

### Recommender Service

```http
GET /api/recommendations/{userId}      # Personalized recommendations
GET /api/recommendations/similar/{bookId} # Similar books
```

### Analytics Service

```http
GET /api/analytics/dashboard           # Global stats
GET /api/analytics/top-books           # Top books
GET /api/analytics/trends              # Trends
```

### Auth Service

```http
POST /api/auth/register                # Registration
POST /api/auth/login                   # Login (returns JWT)
POST /api/auth/refresh                 # Refresh token
```

## 🔐 Security

- **JWT Authentication**: Tokens with expiration
- **Authorization**: Roles (Admin, Librarian, Member)
- **API Gateway**: Token validation
- **HTTPS**: Required in production
- **CORS**: Configured for frontends
- **Rate Limiting**: DDoS protection
- **SQL Injection**: Prevention via EF Core
- **XSS**: Input sanitization

## 📁 Repository Structure

```
eLibrary/
├── .github/
│   ├── workflows/
│   │   └── ci.yml
│   └── PULL_REQUEST_TEMPLATE.md
├── data/
│   └── books.json (50+ entries)
├── docs/
│   ├── architecture.md
│   ├── api.md
│   └── deployment.md
├── services/
│   ├── gateway/
│   ├── catalog-service/
│   ├── auth-service/
│   ├── importer-service/
│   ├── recommender-service/
│   └── analytics-service/
├── frontend/
│   ├── react/
│   └── angular/
├── terraform/
│   ├── main.tf
│   ├── variables.tf
│   └── outputs.tf
├── tests/
│   └── performance/
├── scripts/
│   ├── start-services.ps1
│   ├── stop-services.ps1
│   ├── check-health.ps1
│   └── seed-database.ps1
├── docker-compose.yml
├── docker-compose.dev.yml
├── .editorconfig
├── .gitignore
└── README.md
```

## 🎯 Feature Flags

Simple configuration via `appsettings.json`:

```json
{
  "FeatureFlags": {
    "EnableRecommendations": true,
    "EnableRealTimeNotifications": true,
    "EnableGoogleBooksEnrichment": true,
    "EnableAdvancedAnalytics": false
  }
}
```

## 🤝 Contributing

1. Fork the project
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'feat: Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request (use the template)

## 📝 License

MIT License - see [LICENSE](LICENSE)

## 👥 Authors

Alexandre Cardin - Portfolio Project

---

**Note for recruiters**: This project demonstrates complete mastery of:
- Modern microservices architecture
- Advanced patterns (CQRS, DDD, Event-Driven)
- DevOps and CI/CD
- Automated testing
- Observability and monitoring
- Dual frontend stacks (React & Angular)
- Infrastructure as Code
- Professional Git workflow

**Ready for production. Ready for evaluation.** 🚀
