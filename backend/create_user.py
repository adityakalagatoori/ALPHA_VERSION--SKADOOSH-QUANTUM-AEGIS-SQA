"""
One-time script: create a Supabase Auth user for an already-approved request.
Run from backend folder: python create_user.py
"""
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

admin = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY"))

EMAIL    = "kalagatooriaditya@gmail.com"
PASSWORD = "SQA@2026"

try:
    res = admin.auth.admin.create_user({
        "email": EMAIL,
        "password": PASSWORD,
        "email_confirm": True,
        "user_metadata": {"full_name": "Aditya Kalagatoori"}
    })
    print(f"✅ User created: {res.user.email}")
    print(f"   ID: {res.user.id}")
except Exception as e:
    if "already been registered" in str(e) or "already exists" in str(e):
        # User exists — just update password
        users = admin.auth.admin.list_users()
        for u in users:
            if u.email == EMAIL:
                admin.auth.admin.update_user_by_id(u.id, {"password": PASSWORD})
                print(f"✅ Password updated for existing user: {EMAIL}")
                break
    else:
        print(f"❌ Error: {e}")

print(f"\nLogin at: http://localhost:5173/login")
print(f"Email:    {EMAIL}")
print(f"Password: {PASSWORD}")
