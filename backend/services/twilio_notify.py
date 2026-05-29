"""
Oogway's Signal — Twilio SMS + Phone Call for every security alert.
Called in a background thread so it never blocks the API response.
"""
import os
import threading
from dotenv import load_dotenv

load_dotenv()

_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
_AUTH_TOKEN   = os.getenv("TWILIO_AUTH_TOKEN", "")
_FROM_NUMBER  = os.getenv("TWILIO_PHONE_NUMBER", "")
_TO_NUMBER    = os.getenv("OWNER_PHONE_NUMBER", "")

_AVAILABLE = bool(_ACCOUNT_SID and _AUTH_TOKEN and _FROM_NUMBER and _TO_NUMBER)

if _AVAILABLE:
    print(f"[OOGWAY] Twilio notify active -> {_TO_NUMBER}")
else:
    print("[OOGWAY] Twilio credentials missing — phone alerts disabled")


def _do_notify(alert_type: str, agent_name: str, reason: str, risk_score: int = 0):
    if not _AVAILABLE:
        return
    try:
        from twilio.rest import Client
        client = Client(_ACCOUNT_SID, _AUTH_TOKEN)

        sms_body = (
            f"🚨 SQA OOGWAY ALERT\n"
            f"Type: {alert_type}\n"
            f"Agent: {agent_name}\n"
            f"Reason: {reason}\n"
            f"Risk Score: {risk_score}\n"
            f"— Dragon Warrior Gateway"
        )

        # SMS
        client.messages.create(
            body=sms_body,
            from_=_FROM_NUMBER,
            to=_TO_NUMBER,
        )
        print(f"[OOGWAY] SMS sent -> {_TO_NUMBER} | {alert_type} | {reason}")

        # Phone call with TwiML
        call_text = (
            f"S Q A Security Alert. "
            f"Alert type: {alert_type.replace('_', ' ')}. "
            f"Agent: {agent_name}. "
            f"Reason: {reason.replace('_', ' ')}. "
            f"Risk score: {risk_score}. "
            f"Dragon Warrior Gateway. Stay vigilant."
        )
        twiml = f"<Response><Say voice='alice'>{call_text}</Say></Response>"

        client.calls.create(
            twiml=twiml,
            from_=_FROM_NUMBER,
            to=_TO_NUMBER,
        )
        print(f"[OOGWAY] Call initiated -> {_TO_NUMBER} | {alert_type}")

    except Exception as e:
        print(f"[OOGWAY] Notify error: {e}")


def notify_alert(alert_type: str, agent_name: str, reason: str, risk_score: int = 0):
    """Fire-and-forget — spawns background thread, returns instantly."""
    if not _AVAILABLE:
        return
    t = threading.Thread(
        target=_do_notify,
        args=(alert_type, agent_name, reason, risk_score),
        daemon=True,
    )
    t.start()
