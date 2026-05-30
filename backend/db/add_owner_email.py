"""
Run this once to add owner_email column to the agents table.
Usage: python backend/db/add_owner_email.py
"""
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

SQL = """
ALTER TABLE agents ADD COLUMN IF NOT EXISTS owner_email TEXT;
"""

try:
    result = supabase.rpc("exec_sql", {"sql": SQL}).execute()
    print("Migration complete: owner_email column added to agents table")
except Exception as e:
    print(f"RPC failed — run this SQL directly in Supabase SQL editor:\n\n{SQL}\n\nError: {e}")
