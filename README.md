# Better Assessment

This repository contains my implementation for the Better Software Associate Software Engineer (Python/React) assessment.

- Backend: Flask (CRUD APIs for tasks)
- Frontend: React (task UI using the provided CRUD APIs)
- Tests: Automated tests for backend APIs

## Quick start

Prereqs: Python 3.11+, Node 18+ (or compatible)

1) Backend
- Create venv and install deps
  - python3 -m venv .venv && source .venv/bin/activate
  - pip install -r backend/requirements.txt
- Run the server
  - python backend/run.py
- Health check: http://localhost:5000/api/health

2) Frontend
- Install deps: (cd frontend && npm install)
- Start dev server: (cd frontend && npm run dev)
  - The Vite dev server proxies `/api` to the Flask backend on http://localhost:5000

3) Tests (backend)
- source .venv/bin/activate
- pytest -q backend

## Notes
- CORS is enabled for `/api/*` in development. For production, tighten origins.
- A simple React UI demonstrates Tasks CRUD against the Flask API.
