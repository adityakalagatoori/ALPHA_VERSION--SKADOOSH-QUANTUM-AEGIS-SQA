from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from supabase import create_client

from routes.auth import router as auth_router
from routes.admin import router as admin_router

import os

# ==================================================
# LOAD ENV VARIABLES
# ==================================================

load_dotenv()

# ==================================================
# SUPABASE SETUP
# ==================================================

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase = create_client(
    SUPABASE_URL,
    SUPABASE_KEY
)

# ==================================================
# FASTAPI APP
# ==================================================

app = FastAPI(
    title="SQA Gateway",
    description="Skadoosh Quantum Aegis Backend",
    version="1.0.0"
)

# ==================================================
# CORS
# ==================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================================================
# ROUTES
# ==================================================

app.include_router(auth_router)
app.include_router(admin_router)

# ==================================================
# ROOT ROUTE
# ==================================================

@app.get("/")
def root():

    return {
        "success": True,
        "message": "SQA Gateway is running"
    }

# ==================================================
# HEALTH CHECK
# ==================================================

@app.get("/health")
def health_check():

    return {
        "status": "healthy",
        "service": "SQA Backend",
        "supabase_connected": bool(SUPABASE_URL and SUPABASE_KEY)
    }

# ==================================================
# TEST DATABASE
# ==================================================

@app.get("/test-db")
def test_db():

    try:

        result = (
            supabase
            .table("requests")
            .select("*")
            .execute()
        )

        return {
            "success": True,
            "message": "Database connection successful",
            "count": len(result.data),
            "data": result.data
        }

    except Exception as e:

        print("DATABASE ERROR:", repr(e))

        return {
            "success": False,
            "error": repr(e)
        }

# ==================================================
# DEBUG ENV VARIABLES
# ==================================================

@app.get("/debug-env")
def debug_env():

    return {
        "supabase_url_exists": bool(os.getenv("SUPABASE_URL")),
        "supabase_key_exists": bool(os.getenv("SUPABASE_KEY")),
        "gmail_user_exists": bool(os.getenv("GMAIL_USER")),
        "gmail_pass_exists": bool(os.getenv("GMAIL_PASS")),
        "admin_password_exists": bool(os.getenv("ADMIN_PASSWORD")),
        "jwt_secret_exists": bool(os.getenv("JWT_SECRET"))
    }

# ==================================================
# TEST EMAIL ROUTE
# ==================================================

@app.get("/test-email")
def test_email():

    try:

        from utils.email_sender import send_email

        send_email(
            os.getenv("GMAIL_USER"),
            "SQA Email Test",
            "Your SQA email system is working successfully."
        )

        return {
            "success": True,
            "message": "Test email sent successfully"
        }

    except Exception as e:

        print("EMAIL ERROR:", repr(e))

        return {
            "success": False,
            "error": repr(e)
        }

# ==================================================
# STARTUP EVENT
# ==================================================

@app.on_event("startup")
async def startup_event():

    print("\n==============================")
    print("SQA BACKEND STARTED")
    print("==============================")

    print("Supabase Connected:", bool(SUPABASE_URL))
    print("Gmail Configured:", bool(os.getenv("GMAIL_USER")))
    print("Admin Password Loaded:", bool(os.getenv("ADMIN_PASSWORD")))

    print("==============================\n")