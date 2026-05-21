from fastapi import APIRouter
from pydantic import BaseModel
from supabase import create_client
from dotenv import load_dotenv
import os
import smtplib

from email.mime.text import MIMEText

load_dotenv()

router = APIRouter()

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

class AccessRequest(BaseModel):
    name: str
    email: str
    reason: str


@router.post("/request-access")
def request_access(data: AccessRequest):

    try:

        # DATABASE INSERT
        supabase.table("requests").insert({
            "name": data.name,
            "email": data.email,
            "reason": data.reason,
            "status": "pending"
        }).execute()

        print("DATABASE SUCCESS")

        # EMAIL SEND
        try:

            gmail_user = os.getenv("GMAIL_USER")
            gmail_pass = os.getenv("GMAIL_PASS")

            msg = MIMEText(f"""
New SQA Access Request

Name: {data.name}
Email: {data.email}

Reason:
{data.reason}
""")

            msg["Subject"] = "New SQA Access Request"
            msg["From"] = gmail_user
            msg["To"] = gmail_user

            server = smtplib.SMTP("smtp.gmail.com", 587)

            server.starttls()

            server.login(gmail_user, gmail_pass)

            server.send_message(msg)

            server.quit()

            print("EMAIL SUCCESS")

        except Exception as e:

            print("EMAIL ERROR:", e)

        return {
            "success": True,
            "message": "Request submitted successfully"
        }

    except Exception as e:

        return {
            "success": False,
            "error": str(e)
        }