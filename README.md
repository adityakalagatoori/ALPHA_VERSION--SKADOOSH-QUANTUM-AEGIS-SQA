# SKADOOSH — Quantum AEGIS SQA

SQA [ DOCS / VIDEO ] -https://drive.google.com/drive/folders/1PU6IWj4PVuP2UY6qX_SZWUM4O_PmBKL4?usp=sharing
**Secure Quantum Agent (SQA)** is a post-quantum security layer for AI agents. It blocks prompt-injection and behavioral attacks in real time, then writes a tamper-evident, ML-DSA-signed audit trail that compliance teams can hand to a regulator.

Three lines of Python wrap any agent — LangChain, AutoGen, CrewAI, or custom — with a hash-chained, court-admissible record of everything it tried to do.

```python
from sqa_guard import SQAGuard
guard = SQAGuard(api_url="http://localhost:8000")
agent = guard.wrap("acme-banking-bot-001").bind(agent)
```

---

## Repository layout

| Path | What it is |
|------|------------|
| [backend/](backend/) | FastAPI service: the gateway, security engines, audit log, and v2 API routes |
| [frontend/](frontend/) | React + Vite dashboard (Overview, Monkey, Crane, Snake, Mantis, Tigress, PO, MirrorTest, Honeypot, CaseFile, Guide, SDK pages) |
| [sqa-guard/](sqa-guard/) | The `sqa-guard` Python SDK that agents import to opt in |
| [demo/](demo/) | 3-minute live-demo script: `1_unprotected.py` → `2_protected.py` → `3_show_audit.py` |
| [SUPABASE_SCHEMA.sql](SUPABASE_SCHEMA.sql) | Postgres schema for the audit log, agents, tokens, approvals |
| [render.yaml](render.yaml) | Render deployment manifest for the backend |
| [frontend/vercel.json](frontend/vercel.json) | Vercel deployment manifest for the dashboard |

---

## The security pipeline

Every request to a wrapped agent flows through these stages before the agent ever sees it:

- **MONKEY** — input sanitation and request fingerprinting
- **CRANE** — identity / token / replay verification
- **SNAKE** — anomalous-behavior scoring (XGBoost + SHAP)
- **MANTIS** — semantic prompt-injection detection
- **TIGRESS** — global ASGI middleware enforcing the verdict
- **PO (Verdict Engine)** — BFT-style multi-signal consensus, the final allow / block decision
- **ARMORIQ** — post-quantum signing of the audit entry (ML-DSA-65 / Dilithium)
- **HONEYPOT** — isolates and records attacks for forensics
- **TRIBUNAL** — case-file generation for regulators

The dashboard exposes a live view for each engine.

---

## Running it locally

### Backend (FastAPI)

```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\Activate.ps1
# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Required env vars (place in `backend/.env`):

```
SUPABASE_URL=...
SUPABASE_KEY=...
GEMINI_API_KEY=...
RESEND_API_KEY=...
```

### Frontend (Vite + React 19)

```bash
cd frontend
npm install
npm run dev
```

Dashboard runs on `http://localhost:5173` and talks to the backend on `http://localhost:8000`.

### SDK (sqa-guard)

```bash
cd sqa-guard
pip install -e .
```

Then in your agent code:

```python
from sqa_guard import SQAGuard
guard = SQAGuard(api_url="http://localhost:8000")
agent = guard.wrap("my-agent-id").bind(my_agent)
```

---

## The 3-minute live demo

With the backend running, from the repo root:

```bash
python demo/1_unprotected.py   # naive agent gets owned, no record
python demo/2_protected.py     # same agent + 3-line SDK wrap — attack blocked in <50ms
python demo/3_show_audit.py    # show the hash-chained, ML-DSA-signed audit entry
```

Then open the dashboard → **Case File** → paste the agent id to see the entry land in the UI.

Full presenter script: [demo/README.md](demo/README.md).

---

## Deployment

- **Backend** → Render (Docker, see [backend/Dockerfile](backend/Dockerfile) and [render.yaml](render.yaml)). Render injects `$PORT`; the container listens on `0.0.0.0:$PORT`.
- **Frontend** → Vercel ([frontend/vercel.json](frontend/vercel.json)).
- **Database** → Supabase (Postgres). Apply [SUPABASE_SCHEMA.sql](SUPABASE_SCHEMA.sql) on a fresh project.

---

## Stack

- **Backend** — FastAPI, Uvicorn, Supabase (Postgres), Gemini, Resend, scikit-learn / XGBoost / SHAP, sentence-transformers, `oqs` (liboqs) for ML-DSA-65, `armoriq-sdk`, `fastmcp`
- **Frontend** — React 19, Vite 8, TailwindCSS, Framer Motion, three.js / `@react-three/fiber`, Recharts, Zustand, xterm.js
- **SDK** — Python 3.10+, `httpx`, optional LangChain / CrewAI integrations

---

## License

MIT (see [sqa-guard/pyproject.toml](sqa-guard/pyproject.toml)).
