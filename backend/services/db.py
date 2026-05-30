import os
import httpx
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

_client: Client | None = None
_admin_client: Client | None = None


def _force_http1(client: Client) -> Client:
    """Patch the postgrest httpx session to use HTTP/1.1 only.

    Supabase's default httpx transport uses HTTP/2 which silently drops idle
    connections, causing RemoteProtocolError on the next request. HTTP/1.1
    reconnects automatically on each request.
    """
    try:
        existing = client.postgrest.session
        base_url = str(existing.base_url)
        headers = dict(existing.headers)
        client.postgrest.session = httpx.Client(
            base_url=base_url,
            headers=headers,
            timeout=httpx.Timeout(30.0),
            http2=False,
        )
    except Exception:
        pass
    return client


def _make_client(key: str) -> Client:
    url = os.environ["SUPABASE_URL"]
    return _force_http1(create_client(url, key))


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


def reset_db():
    global _client
    _client = None


def reset_admin_db():
    """Call after a RemoteProtocolError to force reconnection on next get_admin_db()."""
    global _admin_client
    _admin_client = None
