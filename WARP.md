# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project snapshot
- Backend (Flask) is implemented with a tasks CRUD API and tests.
- Frontend (React + Vite + TS) is implemented with a simple Tasks UI.
- Vite dev server proxies `/api` to the Flask backend on port 5000.

High-level architecture
- Backend (Flask, Python)
  - RESTful CRUD endpoints for “tasks” and a `/api/health` check.
  - Layout: `backend/app/` for Flask app, `backend/tests/` for API tests.
- Frontend (React, TypeScript, Vite)
  - Consumes the backend APIs to render and manage tasks in the UI.
- Separation of concerns
  - Frontend and backend run independently in development.

Common commands (canonical)
Backend (Flask)
- Create venv: `python3 -m venv .venv && source .venv/bin/activate`
- Install deps: `pip install -r backend/requirements.txt`
- Run API: `python backend/run.py` (http://localhost:5000)
- Tests: `pytest -q backend`
- Lint/format/type-check (optional): `ruff check backend && ruff format backend && mypy backend/app`

Frontend (React)
- Install deps: `(cd frontend && npm install)`
- Dev server: `(cd frontend && npm run dev)` (http://localhost:5173)
- Build: `(cd frontend && npm run build)`
- Lint: `(cd frontend && npm run lint)`

Conventions
- Directory structure
  - `backend/`: Flask app code and backend tests
  - `frontend/`: React app code
- Local development
  - Frontend uses Vite proxy to reach the backend at `/api`.

Notes for future updates
- Consider Docker/Compose for unified dev environment.
- Optionally add Makefile with shortcuts (backend, frontend, test, lint).
