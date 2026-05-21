from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from jose import jwt
from dotenv import load_dotenv
from database import supabase
from utils.email_sender import send_email

import bcrypt
import os

load_dotenv()

router = APIRouter()

JWT_SECRET = os.getenv("JWT_SECRET")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")


# =========================
# MODELS
# =========================

class AdminLogin(BaseModel):
    password: str


class ApproveUser(BaseModel):
    request_id: int
    custom_password: str


# =========================
# ADMIN LOGIN
# =========================

@router.post("/admin-login")
def admin_login(data: AdminLogin):

    if data.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid admin password")

    token = jwt.encode(
        {"role": "admin"},
        JWT_SECRET,
        algorithm="HS256"
    )

    return {
        "success": True,
        "token": token
    }


# =========================
# VERIFY ADMIN
# =========================

def verify_admin(authorization: str):

    if not authorization:
        raise HTTPException(status_code=401, detail="No token provided")

    try:
        token = authorization.split(" ")[1]

        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=["HS256"]
        )

        if payload["role"] != "admin":
            raise HTTPException(status_code=403, detail="Unauthorized")

    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")


# =========================
# GET PENDING REQUESTS
# =========================

@router.get("/admin/requests")
def get_requests(authorization: str = Header(None)):

    verify_admin(authorization)

    response = (
        supabase.table("requests")
        .select("*")
        .eq("status", "pending")
        .execute()
    )

    return response.data


# =========================
# APPROVE USER
# =========================

@router.post("/admin/approve")
def approve_user(
    data: ApproveUser,
    authorization: str = Header(None)
):

    verify_admin(authorization)

    # GET REQUEST
    req = (
        supabase.table("requests")
        .select("*")
        .eq("id", data.request_id)
        .single()
        .execute()
    )

    if not req.data:
        raise HTTPException(status_code=404, detail="Request not found")

    request_data = req.data

    # HASH PASSWORD
    hashed_password = bcrypt.hashpw(
        data.custom_password.encode(),
        bcrypt.gensalt()
    ).decode()

    # CREATE USER
    supabase.table("users").insert({
        "name": request_data["name"],
        "email": request_data["email"],
        "password_hash": hashed_password,
        "status": "active"
    }).execute()

    # UPDATE REQUEST STATUS
    supabase.table("requests").update({
        "status": "approved"
    }).eq("id", data.request_id).execute()

    # SEND EMAIL
    email_body = f"""
Hello {request_data['name']},

Your SQA access request has been approved.

Login Password:
{data.custom_password}

Welcome to Skadoosh Quantum Aegis.

- Team Launder Lens
"""

    send_email(
        request_data["email"],
        "SQA Access Approved",
        email_body
    )

    return {
        "success": True,
        "message": "User approved successfully"
    }