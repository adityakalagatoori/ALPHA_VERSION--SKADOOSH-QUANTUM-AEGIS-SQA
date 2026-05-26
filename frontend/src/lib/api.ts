export const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000'
export const WS_BASE = import.meta.env.VITE_WS_BASE || 'ws://127.0.0.1:8000'
export const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET || 'sqa-admin-secret-2026'

export function adminHeaders() {
  return {
    'Content-Type': 'application/json',
    'X-Admin-Key': ADMIN_SECRET,
  }
}
