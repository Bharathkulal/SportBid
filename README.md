# SportBid

> **SportBid** is a production-grade sports player registration, tournament management, automated poster generation, and live player auction platform.

---

## 🏟️ Monorepo Structure

```
SportBid/
├── backend/            # FastAPI Python asynchronous service
│   ├── app/
│   │   ├── api/v1/     # Versioned REST API endpoints (Health, etc.)
│   │   ├── core/       # Settings, environment validation, logging
│   │   ├── db/         # Async MongoDB Motor connection lifecycle
│   │   ├── models/     # Database models & ODM structures
│   │   └── schemas/    # Pydantic v2 validation contracts
│   ├── tests/          # Pytest automated test suites
│   ├── pytest.ini      # Test environment configuration
│   └── requirements.txt# Backend dependencies
├── frontend/           # Next.js 16 App Router application
│   ├── src/
│   │   ├── app/        # App router layouts and landing shell
│   │   ├── components/ # Atomic UI & athletic design system
│   │   └── lib/        # Shared frontend utilities
│   └── package.json    # Frontend dependencies
├── docs/               # System architecture & technical specs
│   └── ARCHITECTURE.md # Comprehensive domain & API design doc
├── .env.example        # Environment variable template
└── .gitignore          # Repository git ignore rules
```

---

## 🚀 Quickstart & Development

### 1. One-Click Unified Launcher (Recommended)
You can run both frontend and backend concurrently using either method from the project root:

- **Double-click / Terminal:**
  ```cmd
  run.bat
  ```
  *(or `start.bat`)*

- **Via NPM from root:**
  ```bash
  npm run dev
  ```

To gracefully stop both running services, run:
```cmd
stop.bat
```

---

### 2. Prerequisites
- **Node.js**: v18+ (verified on v24.14.1)
- **Python**: 3.11+ (verified on 3.14.4)
- **MongoDB**: Local MongoDB instance (`mongodb://localhost:27017`) or MongoDB Atlas URI

### 3. Environment Configuration
Copy `.env.example` to `.env` or set required environment variables:
```bash
# Windows PowerShell
Copy-Item .env.example backend\.env
Copy-Item .env.example frontend\.env.local
```

### 3. Backend Setup & Run
```bash
cd backend

# Create virtual environment (if not already created)
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\Activate.ps1
# Unix:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run automated tests
pytest -v

# Start development server
uvicorn app.main:app --reload --port 8000
```
- API Health Check: `http://localhost:8000/api/v1/health`
- Interactive API Docs (Swagger): `http://localhost:8000/docs`

### 4. Frontend Setup & Run
```bash
cd frontend

# Install dependencies
npm install

# Build production bundle
npm run build

# Start development server
npm run dev
```
- Access application: `http://localhost:3000`

---

## 🛡️ Security Best Practices
- Never commit actual `.env` files or secret keys into source control.
- All file uploads are validated strictly on server boundaries.
- Athlete personal contact numbers and private addresses are excluded from public poster templates by design.
- Database access is scoped through FastAPI dependency injection with role-based authorization checks.
