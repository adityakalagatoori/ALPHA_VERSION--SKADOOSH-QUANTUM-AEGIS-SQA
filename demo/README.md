# SQA Live Demo — 3-Minute Presentation Script

## Setup (do this BEFORE the audience arrives)

1. **Backend running** on port 8000:
   ```powershell
   cd backend
   uvicorn main:app --port 8000
   ```

2. **Two browser windows side-by-side:**
   - Left: VS Code with `demo/` folder open
   - Right: SQA dashboard → **Case File** page (or **Demo Guide**)

3. **Test all 3 scripts work** at least once before going live.

---

## The Live Performance (3 minutes)

### Act 1 — "Here's what a normal AI agent looks like" (30 seconds)

**Say:** "This is a typical AI banking agent. It has access to customer data, email, and payments. No security layer. Let me show you what happens when an attacker hits it."

**Run:**
```powershell
python demo/1_unprotected.py
```

**The output dramatically shows:** The agent received the malicious message → executed the harmful action → no record exists.

**Say:** "The agent was compromised. Nobody knows it happened. No audit trail. No proof. This is the default state of every AI agent shipping today."

---

### Act 2 — "Now watch the same agent with SQA" (60 seconds)

**Open `2_protected.py` in VS Code. Show the audience.**

**Say:** "Same agent. Same code. The only difference — these three lines."

**Highlight on screen:**
```python
from sqa_guard import SQAGuard
guard = SQAGuard(api_url="http://localhost:8000")
agent = guard.wrap("acme-banking-bot-001").bind(agent)
```

**Say:** "Three lines. No architecture change. No migration. Now the same attacker tries again."

**Run:**
```powershell
python demo/2_protected.py
```

**The output shows:** `🛑 BLOCKED BY SQA — Prompt injection pattern detected`

**Say:** "Blocked in under 50 milliseconds. The agent never saw the malicious message. TIGRESS — our semantic firewall — killed it at the gate."

---

### Act 3 — "But here's the part nobody else does" (60 seconds)

**Say:** "Blocking the attack is the easy part. Here's what makes us different."

**Run:**
```powershell
python demo/3_show_audit.py
```

**The output shows:** The audit log entry with `prev_hash`, `current_hash`, and `dilithium_sig`.

**Say:** "Even though the action was blocked, we permanently recorded the attempt — with a SHA-3 hash chained to the previous entry, signed with ML-DSA-65, the same algorithm NIST selected for post-quantum cryptography. Tamper with this log and the math breaks instantly."

**Switch to the SQA dashboard** → Case File page → paste `acme-banking-bot-001` → show the entry appearing in the UI.

**Say:** "This is what compliance teams in banking and healthcare cannot get from any other tool. When a regulator asks 'what did your AI do' — we hand them a cryptographic answer."

---

### The Close (30 seconds)

**Say:**

> "Three lines of code. Any agent framework — LangChain, AutoGen, CrewAI, custom Python. From owned to protected to court-admissible audit trail. The whole pipeline runs in under 200 milliseconds.
>
> You don't change your agent. You don't migrate your infrastructure. You add three lines, and your AI is suddenly defensible — technically, operationally, and legally."

**End.**

---

## What If Something Breaks Live?

| Problem | Recovery line |
|---------|---------------|
| Backend is slow/cold | "Let me show you what this looks like in production..." (open dashboard) |
| Script throws an error | "This is the joy of live demos. The underlying flow is in the dashboard." → switch tabs |
| Internet dies | All 3 scripts use `localhost` — no internet needed |
| Audit log is empty | Run `2_protected.py` once more — that creates the entry |

---

## Pro Tips

- **Maximize the terminal font.** Audiences can't read 12pt.
- **Pause for 2 seconds** after running each script. Let them read the output.
- **Don't apologize for the simplicity** of the demo agent — "real LangChain agents work identically; the wrap is the same."
- **The dashboard switch is the climax.** Practice it. Have the Case File page already loaded with `acme-banking-bot-001` typed in.
