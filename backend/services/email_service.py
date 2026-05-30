import os
from dotenv import load_dotenv

load_dotenv()

RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
RESEND_FROM_EMAIL = os.getenv("RESEND_FROM_EMAIL", "noreply@sqa.ai")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

RESEND_AVAILABLE = bool(RESEND_API_KEY)

if RESEND_AVAILABLE:
    try:
        import resend
        resend.api_key = RESEND_API_KEY
        print("[EMAIL] Resend email service active")
    except ImportError:
        RESEND_AVAILABLE = False
        print("[EMAIL] Resend not installed — emails disabled")
else:
    print("[EMAIL] No RESEND_API_KEY — emails disabled")


def send_approval_email(to_email: str, full_name: str, temp_password: str) -> bool:
    if not RESEND_AVAILABLE:
        print(f"[EMAIL SKIPPED] Would send approval to {to_email}")
        return False

    login_url = f"{FRONTEND_URL}/login"

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #020617; color: #e2e8f0; margin: 0; padding: 0; }}
        .container {{ max-width: 600px; margin: 40px auto; padding: 40px; background: #0b1220; border: 1px solid rgba(6, 182, 212, 0.2); border-radius: 16px; }}
        .logo {{ color: #06b6d4; font-size: 28px; font-weight: 900; letter-spacing: 2px; margin-bottom: 8px; }}
        .tagline {{ color: #64748b; font-size: 13px; margin-bottom: 32px; }}
        h1 {{ color: #f8fafc; font-size: 24px; margin-bottom: 8px; }}
        .badge {{ display: inline-block; background: rgba(34, 197, 94, 0.15); color: #22c55e; border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 6px; padding: 4px 12px; font-size: 12px; font-weight: 700; letter-spacing: 1px; margin-bottom: 24px; }}
        .credential-box {{ background: #0f172a; border: 1px solid rgba(6, 182, 212, 0.15); border-radius: 12px; padding: 24px; margin: 24px 0; }}
        .credential-label {{ color: #64748b; font-size: 12px; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px; }}
        .credential-value {{ color: #06b6d4; font-family: 'Monaco', monospace; font-size: 16px; font-weight: 700; }}
        .cta {{ display: inline-block; background: #06b6d4; color: #020617; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 800; font-size: 15px; letter-spacing: 0.5px; margin: 24px 0; }}
        .warning {{ color: #f59e0b; font-size: 12px; margin-top: 16px; }}
        .footer {{ margin-top: 40px; color: #334155; font-size: 12px; border-top: 1px solid #1e293b; padding-top: 24px; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">SQA</div>
        <div class="tagline">Post-Quantum AI Agent Security Gateway</div>
        <div class="badge">ACCESS APPROVED</div>
        <h1>Welcome, {full_name}</h1>
        <p style="color: #94a3b8; line-height: 1.6;">Your access request to the SQA platform has been approved. Below are your temporary credentials to access the Mission Control dashboard.</p>
        <div class="credential-box">
          <div class="credential-label">Email</div>
          <div class="credential-value" style="margin-bottom: 16px;">{to_email}</div>
          <div class="credential-label">Temporary Password</div>
          <div class="credential-value">{temp_password}</div>
        </div>
        <a href="{login_url}" class="cta">Access Mission Control →</a>
        <div class="warning">⚠️ Change your password after first login. This link goes to {login_url}</div>
        <div class="footer">
          SQA Dragon Warrior Platform &middot; Post-Quantum Security &middot; <a href="{FRONTEND_URL}" style="color: #06b6d4;">sqa.ai</a>
        </div>
      </div>
    </body>
    </html>
    """

    try:
        import resend
        result = resend.Emails.send({
            "from": RESEND_FROM_EMAIL,
            "to": [to_email],
            "subject": "SQA Platform — Access Approved",
            "html": html
        })
        print(f"[EMAIL] Approval sent to {to_email} — id: {getattr(result, 'id', result)}")
        return True
    except Exception as e:
        print(f"[EMAIL ERROR] {type(e).__name__}: {e}")
        return False


def send_rejection_email(to_email: str, full_name: str) -> bool:
    if not RESEND_AVAILABLE:
        return False

    html = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: sans-serif; background: #020617; color: #e2e8f0; padding: 40px;">
      <h2 style="color: #06b6d4;">SQA Access Request Update</h2>
      <p>Hi {full_name},</p>
      <p>Unfortunately, your access request to the SQA platform was not approved at this time.</p>
      <p style="color: #64748b;">You may resubmit a new request with additional context about your use case.</p>
    </body>
    </html>
    """

    try:
        import resend
        resend.Emails.send({
            "from": RESEND_FROM_EMAIL,
            "to": [to_email],
            "subject": "SQA Platform — Access Request Update",
            "html": html
        })
        return True
    except Exception as e:
        print(f"[EMAIL ERROR] {type(e).__name__}: {e}")
        return False
