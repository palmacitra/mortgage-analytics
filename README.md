# Hyper Mortgage Agentic Tool

AI-Powered KPR Pre-Approval Engine — Proof of Concept

Stack: Python FastAPI · React + Vite · Tailwind CSS · Recharts

---

## Structure

```
hyper-mortgage/
├── docs/
│   ├── 01-login.png
│   ├── 02-dashboard.png
│   ├── 03-leads.png
│   ├── 04-pipeline.png
│   └── 05-analytics.png
├── data/
│   └── synthetic_customers.json
├── backend/
│   ├── main.py
│   └── requirements.txt
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css
│       └── assets/
│           ├── logo.png
│           └── favicon.png
└── README.md
```

---

## Prerequisites

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3-venv python3-pip
```

Node.js 20 LTS:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version   # v20.x.x
```

---

## Setup

### Backend

```bash
cd ~/hyper-mortgage
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
```

### Frontend

```bash
cd ~/hyper-mortgage/frontend
npm install
cd ..
```

---

## Running

Open two terminals.

### Terminal 1 — Backend

```bash
cd ~/hyper-mortgage
source .venv/bin/activate
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

Expected:
```
[startup] Loaded 15 customers and 10 districts.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Terminal 2 — Frontend

```bash
cd ~/hyper-mortgage/frontend
npm run dev
```

---

## URLs

| Service      | URL                         |
|--------------|-----------------------------|
| Application  | http://localhost:5173       |
| API Docs     | http://localhost:8000/docs  |
| Health Check | http://localhost:8000/health|

---

## Login Credentials

| Field    | Value |
|----------|-------|
| Username | user  |
| Password | user  |

Session stored in sessionStorage — cleared on logout or tab close.

---

## Pages

| Page         | Description                                                         |
|--------------|---------------------------------------------------------------------|
| Dashboard    | KPR scoring engine with gauge, DTI meter, district recommendations  |
| Leads        | Prospect list with Hot/Warm/Cold filter                             |
| Applications | KPR application table with approval status and score                |
| Pipeline     | Kanban board: Inquiry, Assessment, Submission, Approval, Disbursed  |
| Tasks        | Checklist with priority levels, tags, and toggle completion         |
| AI Agent     | Rule-based chatbot for KPR and BI regulation questions              |
| Analytics    | Area chart trends, district breakdown, conversion funnel            |
| Settings     | Account config, KPR parameter editor, system info                   |

---

## API Endpoints

```
GET  /api/customers     List all customers
POST /api/analyze       { "customer_id": "C001" } -> full analysis
GET  /api/market-data   Property prices per district
GET  /health            Server status
GET  /docs              Swagger UI
```

### curl examples

```bash
curl http://localhost:8000/api/customers | python3 -m json.tool

curl -X POST http://localhost:8000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"customer_id": "C001"}' | python3 -m json.tool
```

---

## Troubleshooting

Port already in use:
```bash
sudo lsof -i :8000 && kill -9 <PID>
sudo lsof -i :5173 && kill -9 <PID>
```

venv not active:
```bash
source ~/hyper-mortgage/.venv/bin/activate
```

Node modules error:
```bash
cd frontend && rm -rf node_modules package-lock.json && npm install
```

Backend data file not found: always run uvicorn from the project root, not from inside backend/.

Frontend cannot reach API: ensure backend is running on port 8000 before opening the browser. The Vite dev server proxies /api/* to localhost:8000.

---

## KPR Rules Reference

| Parameter           | Value                                     |
|---------------------|-------------------------------------------|
| Tenor               | 240 months (20 years)                     |
| Interest rate       | 7.75% p.a. fixed                          |
| Max DTI             | 40% gross income (BI Reg. 17/10/PBI/2015) |
| Down payment        | 10% non-subsidi                           |
| FLPP down payment   | 1%                                        |
| FLPP income ceiling | IDR 8,000,000/month                       |

---

*Hyper Mortgage Agentic Tool — Proof of Concept. Synthetic data only, not official financial advice.*
