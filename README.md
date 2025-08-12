# 🚀 Smart Offertgenerator - MVP Starter

En komplett MVP för att generera offerter med FastAPI backend och Next.js frontend.

## ✅ Fixade problem

- **Database initialization**: Flyttade från modul-laddning till app-startup
- **Error handling**: Lade till proper error handling i både backend och frontend
- **Loading states**: Lade till loading states för bättre UX
- **Environment files**: Automatisk skapning av .env filer
- **Type safety**: Förbättrade TypeScript-typer

## 🚀 Snabbstart

### Alternativ 1: Automatisk startup (rekommenderat)
```bash
./start.sh
```

### Alternativ 2: Manuell startup
```bash
# 1. Skapa environment filer
echo "DATABASE_URL=postgresql+psycopg://app:app@db:5432/quotes" > backend/.env
echo "COMPANY_ID=00000000-0000-0000-0000-000000000001" >> backend/.env
echo "PROFILE_ID=00000000-0000-0000-0000-000000000001" >> backend/.env

echo "NEXT_PUBLIC_API_BASE=http://localhost:8000" > frontend/.env.local

# 2. Starta med Docker
docker-compose up --build
```

## 🌐 Tillgängliga endpoints

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **PostgreSQL**: localhost:5432

## 📁 Projektstruktur

```
smart-offertgenerator/
├─ backend/          # FastAPI backend
├─ frontend/         # Next.js frontend
├─ docker-compose.yml
├─ start.sh          # Automatisk startup
└─ README.md
```

## 🔧 Utveckling

### Backend (utan Docker)
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # På Windows: .venv\Scripts\activate
pip install -e .
export DATABASE_URL=postgresql+psycopg://app:app@localhost:5432/quotes
uvicorn app.main:app --reload
```

### Frontend (utan Docker)
```bash
cd frontend
npm install
npm run dev
```

## 🐛 Felsökning

### Vanliga problem:

1. **Port 5432 används redan**: Stäng andra PostgreSQL-instanser
2. **Frontend kan inte ansluta till backend**: Kontrollera att backend körs på port 8000
3. **Database connection failed**: Vänta tills PostgreSQL är redo (kan ta några sekunder)

### Loggar:
```bash
# Visa alla loggar
docker-compose logs

# Visa specifik service
docker-compose logs backend
docker-compose logs frontend
```

## 📊 Nästa steg

- [ ] Lägg till autentisering (JWT/Clerk)
- [ ] PDF-export av offerter
- [ ] Materialpåslag i UI
- [ ] Offert-mallar
- [ ] Event tracking
- [ ] BankID-integration
- [ ] Fortnox/Visma-integration

## 🤝 Bidrag

1. Forka projektet
2. Skapa en feature branch
3. Committa dina ändringar
4. Pusha till branchen
5. Öppna en Pull Request

## 📄 Licens

MIT License - se LICENSE fil för detaljer.
