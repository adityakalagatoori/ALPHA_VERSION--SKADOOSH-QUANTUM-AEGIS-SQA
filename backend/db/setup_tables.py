import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# =========================================================
# TABLE SCHEMAS
# =========================================================

TABLES = {
    "approvers": """
        user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        role TEXT NOT NULL,
        dilithium_public_key TEXT NOT NULL,
        sector_permissions TEXT[] NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT now()
    """,
    "pending_actions": """
        task_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        action_type TEXT NOT NULL,
        sector TEXT NOT NULL,
        agent_id TEXT NOT NULL,
        risk_score FLOAT DEFAULT 0,
        required_approvals INT DEFAULT 2,
        current_approvals INT DEFAULT 0,
        trust_score FLOAT DEFAULT 100,
        tribunal_result JSONB,
        execution_status TEXT DEFAULT 'PENDING_APPROVAL',
        payload JSONB,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now()
    """,
    "action_approvals": """
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        task_id UUID REFERENCES pending_actions(task_id),
        approver_id UUID REFERENCES approvers(user_id),
        signature TEXT NOT NULL,
        verified BOOLEAN DEFAULT false,
        approved_at TIMESTAMPTZ DEFAULT now()
    """,
    "policy_logs": """
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        agent_id TEXT NOT NULL,
        action TEXT NOT NULL,
        sector TEXT,
        sqa_decision TEXT NOT NULL,
        armoriq_decision TEXT NOT NULL,
        armoriq_action TEXT,
        armoriq_reason TEXT,
        final_decision TEXT NOT NULL,
        risk_score FLOAT,
        trust_score FLOAT,
        metadata JSONB,
        created_at TIMESTAMPTZ DEFAULT now()
    """,
    "tribunal_logs": """
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        agent_id TEXT NOT NULL,
        action TEXT NOT NULL,
        decision TEXT NOT NULL,
        confidence FLOAT NOT NULL,
        feature_importance JSONB NOT NULL,
        gemini_explanation TEXT,
        shap_values JSONB,
        created_at TIMESTAMPTZ DEFAULT now()
    """
}

# =========================================================
# CREATE TABLES
# =========================================================

def setup_tables():
    print("\n===================================")
    print(" SUPABASE TABLE SETUP ")
    print("===================================\n")

    for table_name, schema in TABLES.items():
        sql = f"CREATE TABLE IF NOT EXISTS {table_name} ({schema});"

        try:
            response = supabase.rpc(
                "sql",
                {"query": sql}
            ).execute()
            print(f"✓ Created/verified table: {table_name}")
        except Exception as e:
            # Try direct SQL approach via execute
            try:
                supabase.table(table_name).select("*", count="exact").execute()
                print(f"✓ Table exists: {table_name}")
            except:
                print(f"✗ Failed to create table {table_name}: {e}")

    print("\n===================================")
    print(" SETUP COMPLETE ")
    print("===================================\n")

if __name__ == "__main__":
    setup_tables()
