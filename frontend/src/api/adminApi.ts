import { API_BASE, ADMIN_SECRET } from '../lib/api'

const adminHeaders = {
  'Content-Type': 'application/json',
  'X-Admin-Key': ADMIN_SECRET,
}

export async function fetchSystemHealth() {
  const res = await fetch(`${API_BASE}/admin/system-health`, { headers: adminHeaders })
  if (!res.ok) throw new Error('Unauthorized')
  return res.json()
}

export async function fetchConnectedUsers() {
  const res = await fetch(`${API_BASE}/admin/connected-users`, { headers: adminHeaders })
  if (!res.ok) throw new Error('Unauthorized')
  return res.json()
}

export async function fetchFeatureFlags() {
  const res = await fetch(`${API_BASE}/admin/feature-flags`, { headers: adminHeaders })
  if (!res.ok) throw new Error('Unauthorized')
  return res.json()
}

export async function fetchApprovedUsers() {
  const res = await fetch(`${API_BASE}/admin/users`, { headers: adminHeaders })
  if (!res.ok) throw new Error('Unauthorized')
  return res.json()
}

export async function triggerDemoAttack(attackType: string) {
  const res = await fetch(`${API_BASE}/admin/demo/${attackType}`, {
    method: 'POST',
    headers: adminHeaders,
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail || 'Demo attack failed')
  }
  return res.json()
}

export async function fetchMetrics() {
  const res = await fetch(`${API_BASE}/metrics`)
  if (!res.ok) throw new Error('Failed')
  return res.json()
}

export async function fetchSnakeChainStatus() {
  const res = await fetch(`${API_BASE}/snake/chain-status`)
  if (!res.ok) throw new Error('Failed')
  return res.json()
}

export async function fetchSnakeMerkleRoot() {
  const res = await fetch(`${API_BASE}/snake/merkle-root`)
  if (!res.ok) throw new Error('Failed')
  return res.json()
}

export async function fetchSnakeCheckpoints() {
  const res = await fetch(`${API_BASE}/snake/checkpoints`)
  if (!res.ok) throw new Error('Failed')
  return res.json()
}

export async function fetchTrustScores() {
  const res = await fetch(`${API_BASE}/po/trust/all`)
  if (!res.ok) throw new Error('Failed')
  return res.json()
}

export async function triggerTribunalDemo(token: string, action: string) {
  const res = await fetch(`${API_BASE}/tribunal-demo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, attempted_action: action }),
  })
  if (!res.ok) throw new Error('Failed')
  return res.json()
}
