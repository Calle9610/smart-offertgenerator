# 🚀 Smart Quote Generator

[![CI/CD Pipeline](https://github.com/carllundin/smart-offertgenerator/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/carllundin/smart-offertgenerator/actions/workflows/ci-cd.yml)
[![Security Scan](https://github.com/carllundin/smart-offertgenerator/actions/workflows/security.yml/badge.svg)](https://github.com/carllundin/smart-offertgenerator/actions/workflows/security.yml)
[![Dependencies](https://github.com/carllundin/smart-offertgenerator/actions/workflows/dependencies.yml/badge.svg)](https://github.com/carllundin/smart-offertgenerator/actions/workflows/dependencies.yml)

A modern, intelligent quote generation system for construction companies with JWT authentication, multi-tenant support, and PDF generation capabilities.

## ✨ Features

- 🔐 **JWT Authentication** with multi-tenant support
- 🏢 **Company Management** with tenant isolation
- 💰 **Smart Pricing** with labor rates and material costs
- 📄 **PDF Generation** with professional templates
- 🐳 **Docker Support** for easy deployment
- 🗄️ **Database Migrations** with Alembic
- 📊 **Error Monitoring** with Sentry integration
- 🚀 **CI/CD Pipeline** with GitHub Actions
- 🔒 **Security Scanning** with automated vulnerability checks

## 🔐 Authentication & Logout

### Login/Logout System

Smart Quote Generator har en komplett autentiseringshantering med JWT-tokens:

#### **Startsidan (/)**
- Visar autentiseringsstatus dynamiskt
- Om inloggad: Visar användarnamn och logout-knapp
- Om inte inloggad: Visar login-knapp som leder till `/intake/new`
- Logout-knapp med bekräftelsedialog för säkerhet

#### **Header-komponent**
- Visas på alla sidor utom startsidan
- Innehåller navigation och autentiseringsstatus
- Logout-knapp med bekräftelsedialog
- Automatisk token-validering mot backend

#### **Logout-funktionalitet**
- Rensar JWT-token från localStorage
- Uppdaterar UI-state
- Omdirigerar till startsidan
- Bekräftelsedialog förhindrar oavsiktliga utloggningar

#### **Säkerhet**
- Token valideras mot backend vid varje sidladdning
- Automatisk utloggning vid ogiltig/expired token
- Multi-tenant isolation bevaras

### Användning

1. **Logga in**: Klicka "Logga in" → dirigeras till `/intake/new`
2. **Se status**: Användarnamn visas i högra hörnet
3. **Logga ut**: Klicka "Logga ut" → bekräfta → utloggad

## 🏗️ Architecture

- **Backend**: FastAPI + SQLAlchemy + PostgreSQL
- **Frontend**: Next.js + TypeScript + Tailwind CSS
- **Database**: PostgreSQL with Alembic migrations
- **Authentication**: JWT with bcrypt password hashing
- **PDF Generation**: Jinja2 templates + WeasyPrint
- **Monitoring**: Sentry for error tracking and performance
- **CI/CD**: GitHub Actions with comprehensive testing

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Git

## 🔄 Smart Intake Flow

### Hur autogenerering funkar

Smart Quote Generator använder en intelligent regelbaserad approach för att automatiskt generera offerter från projektkrav:

#### **1. Projektkrav (Intake)**
- Användaren fyller i detaljerade projektkrav via IntakeWizard
- Systemet samlar in: rumstyp, yta, utförandenivå, specialkrav
- Data sparas i `project_requirements` tabellen med company_id-scoping

#### **2. Regelbaserad autogenerering**
- Systemet matchar projektkrav mot `generation_rules` tabellen
- Regel-nyckel format: `"rumstyp|utförandenivå"` (t.ex. `"bathroom|premium"`)
- Regler innehåller matematiska uttryck med variabler:
  ```json
  {
    "labor": {
      "SNICK": "8 + 2*areaM2",
      "VVS": "hasPlumbingWork ? 6 : 0"
    },
    "materials": {
      "KAKEL20": "areaM2 * 1.2",
      "FOG5": "ceil(areaM2 / 10)"
    }
  }
  ```

#### **3. Säker utvärdering**
- `RuleEvaluator` använder endast säkra matematiska operationer
- Stöd för: `+`, `-`, `*`, `/`, `ceil()`, ternära operatorer
- Validering av alla inputs (inga `eval()` eller osäkra operationer)
- Variabler mappas från projektkrav: `areaM2`, `hasPlumbingWork`, etc.

#### **4. Prisberäkning**
- Labor-priser hämtas från `labor_rates` tabellen
- Material-priser beräknas med markup från `materials` tabellen
- Confidence-nivåer baseras på tillgänglig data

#### **5. Användarjusteringar**
- Användaren kan justera auto-genererade värden
- Ändringar loggas i `quote_adjustment_log` för audit trail
- `sourceItems` spårar original vs. justerade värden

#### **6. PDF-generering**
- Professionella offerter genereras med Jinja2-templates
- Inkluderar alla justeringar och confidence-nivåer
- Multi-tenant säker med company_id-scoping

### Exempel på regel-nycklar
- `"bathroom|basic"` - Grundläggande badrum
- `"bathroom|standard"` - Standard badrum
- `"bathroom|premium"` - Premium badrum
- `"kitchen|standard"` - Standard kök
- `"flooring|premium"` - Premium golv

### Säkerhetsfunktioner
- **Multi-tenant isolation**: Alla queries scoped av `company_id`
- **Input validation**: Alla projektkrav valideras med Pydantic
- **Safe evaluation**: Inga `eval()` eller osäkra operationer
- **JWT authentication**: Säker API-åtkomst med token-baserad auth
- **Audit logging**: Alla ändringar loggas för compliance

### 1. Clone and Setup

```bash
git clone https://github.com/carllundin/smart-offertgenerator.git
cd smart-offertgenerator
```

### 2. Start Services

```bash
# Start all services
docker-compose up --build

# Or use the start script
./start.sh
```

### 3. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

### 4. Default Credentials

- **Username**: `admin`
- **Password**: `admin123`

## 🔧 Development

### Local Development Setup

```bash
# Backend
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -e ".[dev]"
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

### Running Tests

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm run lint
npm run build
```

### Code Quality

```bash
# Install pre-commit hooks
pip install pre-commit
pre-commit install

# Run all checks
pre-commit run --all-files
```

## 📚 API Endpoints

### Authentication
- `POST /token` - Login and get JWT token
- `GET /users/me` - Get current user info
- `POST /users` - Create new user (admin only)

### Quotes
- `POST /quotes/calc` - Calculate quote totals
- `POST /quotes` - Create new quote
- `GET /quotes` - Get all quotes for tenant
- `POST /quotes/{id}/pdf` - Generate PDF

### Companies
- `GET /companies` - Get companies for tenant

## 🐳 Docker

### Services

- **db**: PostgreSQL database
- **backend**: FastAPI application
- **frontend**: Next.js application

### Environment Variables

Create `.env` files in `backend/` and `frontend/` directories:

```bash
# Backend (.env)
DATABASE_URL=postgresql+psycopg://app:app@db:5432/quotes
SECRET_KEY=your-secret-key-here
ENVIRONMENT=development
SENTRY_DSN=your-sentry-dsn

# Frontend (.env.local)
NEXT_PUBLIC_API_BASE=http://localhost:8000
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

## 🔒 Security

- **JWT Authentication** with secure token handling
- **Multi-tenant isolation** for data security
- **Password hashing** with bcrypt
- **CORS protection** for cross-origin requests
- **Input validation** with Pydantic schemas
- **Automated security scanning** with GitHub Actions

## 📊 Monitoring

### Sentry Integration

- Real-time error tracking
- Performance monitoring
- User experience insights
- Release tracking

### Health Checks

- API health endpoint: `/health`
- Database connectivity monitoring
- Service status tracking

## 🚀 CI/CD Pipeline

Our GitHub Actions workflow provides:

- ✅ **Automated Testing**: Backend and frontend tests
- ✅ **Code Quality**: Linting, formatting, and type checking
- ✅ **Security Scanning**: Vulnerability detection and reporting
- ✅ **Docker Building**: Automated container creation
- ✅ **Integration Testing**: End-to-end service testing
- ✅ **Dependency Updates**: Automatic security patches
- ✅ **Deployment**: Staging and production automation

See [CI_CD_README.md](CI_CD_README.md) for detailed information.

## 🧪 Testing

### Backend Tests

- Unit tests with pytest
- Integration tests with test database
- 80% minimum code coverage
- Security scanning with Bandit

### Frontend Tests

- TypeScript compilation checks
- ESLint and Prettier formatting
- Build verification
- Component testing

## 📁 Project Structure

```
smart-offertgenerator/
├── .github/workflows/          # GitHub Actions workflows
├── backend/                    # FastAPI backend
│   ├── app/                   # Application code
│   ├── alembic/              # Database migrations
│   ├── templates/             # PDF templates
│   └── tests/                 # Test suite
├── frontend/                  # Next.js frontend
│   ├── src/                   # Source code
│   └── components/            # React components
├── docker-compose.yml         # Service orchestration
└── README.md                  # This file
```

## 🔄 Database Migrations

```bash
# Create new migration
docker-compose run --rm backend alembic revision --autogenerate -m "Description"

# Apply migrations
docker-compose run --rm backend alembic upgrade head

# Rollback migration
docker-compose run --rm backend alembic downgrade -1
```

## 🚨 Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 3000, 8000, and 5432 are available
2. **Database connection**: Check if PostgreSQL container is running
3. **PDF generation**: Verify WeasyPrint dependencies are installed
4. **Authentication**: Check JWT secret key configuration

### Debug Commands

```bash
# Check service logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs db

# Restart services
docker-compose restart backend frontend

# Rebuild containers
docker-compose build --no-cache
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- FastAPI for the excellent backend framework
- Next.js for the modern frontend framework
- PostgreSQL for reliable data storage
- Docker for containerization
- GitHub Actions for CI/CD automation
- Sentry for monitoring and error tracking

---

🎉 **Ready to generate smart quotes? Start building!**

For detailed CI/CD documentation, see [CI_CD_README.md](CI_CD_README.md).
For Sentry setup instructions, see [SENTRY_SETUP.md](SENTRY_SETUP.md).
