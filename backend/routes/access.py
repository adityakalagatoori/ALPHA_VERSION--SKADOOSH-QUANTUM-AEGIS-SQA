import os
import secrets
import string
from datetime import datetime

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel, EmailStr
from typing import Optional

from dotenv import load_dotenv
load_dotenv()

router = APIRouter()

ADMIN_SECRET_KEY = os.getenv("ADMIN_SECRET_KEY", "sqa-admin-secret-2026")


# =========================================================
# MODELS
# =========================================================

class AccessRequestCreate(BaseModel):
    full_name: str
    email: str
    organization: str
    sector: str
    purpose: str
    expected_usage: str


# =========================================================
# HELPERS
# =========================================================

def require_admin(x_admin_key: Optional[str] = Header(None)):
    if x_admin_key != ADMIN_SECRET_KEY:
        raise HTTPException(status_code=403, detail="Invalid admin key")


def generate_temp_password(length: int = 12) -> str:
    alphabet = string.ascii_letters + string.digits + "!@#$"
    return ''.join(secrets.choice(alphabet) for _ in range(length))


def get_supabase():
    try:
        from db.supabase import supabase
        return supabase
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database unavailable: {e}")


# =========================================================
# SUBMIT ACCESS REQUEST (public)
# =========================================================

@router.post("/request")
async def submit_access_request(data: AccessRequestCreate):
    """Public endpoint — submit an access request form."""
    supabase = get_supabase()

    # Check for duplicate email
    existing = supabase.table("access_requests").select("id").eq("email", data.email).execute()
    if existing.data:
        raise HTTPException(status_code=409, detail="An access request for this email already exists.")

    result = supabase.table("access_requests").insert({
        "full_name": data.full_name,
        "email": data.email,
        "organization": data.organization,
        "sector": data.sector,
        "purpose": data.purpose,
        "expected_usage": data.expected_usage,
        "status": "pending"
    }).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to submit request")

    return {
        "status": "submitted",
        "message": "Your access request has been received. We'll review and email you within 24 hours.",
        "id": result.data[0].get("id")
    }


# =========================================================
# LIST ALL REQUESTS (admin only)
# =========================================================

@router.get("/requests")
async def list_access_requests(x_admin_key: Optional[str] = Header(None)):
    require_admin(x_admin_key)
    supabase = get_supabase()

    result = supabase.table("access_requests").select("*").order("created_at", desc=True).execute()

    return {
        "requests": result.data or [],
        "count": len(result.data or []),
        "pending": len([r for r in (result.data or []) if r.get("status") == "pending"]),
        "approved": len([r for r in (result.data or []) if r.get("status") == "approved"]),
        "rejected": len([r for r in (result.data or []) if r.get("status") == "rejected"])
    }


# =========================================================
# APPROVE REQUEST (admin only)
# =========================================================

@router.post("/requests/{request_id}/approve")
async def approve_access_request(request_id: str, x_admin_key: Optional[str] = Header(None)):
    require_admin(x_admin_key)
    supabase = get_supabase()

    # Get the request
    result = supabase.table("access_requests").select("*").eq("id", request_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Access request not found")

    request_data = result.data[0]
    if request_data.get("status") == "approved":
        raise HTTPException(status_code=400, detail="Already approved")

    # Generate temp password
    temp_password = generate_temp_password()

    # Update access request status
    supabase.table("access_requests").update({
        "status": "approved",
        "reviewed_at": datetime.utcnow().isoformat()
    }).eq("id", request_id).execute()

    # Create approved user record
    existing_user = supabase.table("approved_users").select("id").eq("email", request_data["email"]).execute()
    if not existing_user.data:
        supabase.table("approved_users").insert({
            "email": request_data["email"],
            "full_name": request_data["full_name"],
            "organization": request_data["organization"],
            "role": "analyst",
            "temp_password": temp_password,
            "access_request_id": request_id
        }).execute()

    # Send approval email
    email_sent = False
    try:
        from services.email_service import send_approval_email
        email_sent = send_approval_email(
            request_data["email"],
            request_data["full_name"],
            temp_password
        )
    except Exception as e:
        print(f"[ACCESS] Email send error: {e}")

    return {
        "status": "approved",
        "email": request_data["email"],
        "full_name": request_data["full_name"],
        "temp_password": temp_password,
        "email_sent": email_sent,
        "message": f"User approved. Temp password: {temp_password}"
    }


# =========================================================
# REJECT REQUEST (admin only)
# =========================================================

@router.post("/requests/{request_id}/reject")
async def reject_access_request(request_id: str, x_admin_key: Optional[str] = Header(None)):
    require_admin(x_admin_key)
    supabase = get_supabase()

    result = supabase.table("access_requests").select("*").eq("id", request_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Access request not found")

    request_data = result.data[0]

    supabase.table("access_requests").update({
        "status": "rejected",
        "reviewed_at": datetime.utcnow().isoformat()
    }).eq("id", request_id).execute()

    try:
        from services.email_service import send_rejection_email
        send_rejection_email(request_data["email"], request_data["full_name"])
    except Exception:
        pass

    return {
        "status": "rejected",
        "email": request_data["email"]
    }
