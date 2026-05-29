import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

_client: Client | None = None
_admin_client: Client | None = None


def _make_client(key: str) -> Client:
    url = os.environ["SUPABASE_URL"]
    return create_client(url, key)


def get_db() -> Client:
    global _client
    if _client is None:
        key = os.environ.get("SUPABASE_KEY") or os.environ.get("SUPABASE_ANON_KEY")
        _client = _make_client(key)
    return _client


def get_admin_db() -> Client:
    global _admin_client
    if _admin_client is None:
        key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY")
        _admin_client = _make_client(key)
    return _admin_client


def reset_admin_db():
    """Call after a RemoteProtocolError to force reconnection on next get_admin_db()."""
    global _admin_client
    _admin_client = None
