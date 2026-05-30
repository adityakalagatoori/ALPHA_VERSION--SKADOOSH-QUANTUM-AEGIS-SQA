import { API_BASE } from '../lib/api'

export interface AccessRequestData {
  full_name: string
  email: string
  organization: string
  sector: string
  purpose: string
  expected_usage: string
}

export async function submitAccessRequest(data: AccessRequestData) {
  const res = await fetch(`${API_BASE}/access/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail || 'Failed to submit request')
  }
  return res.json()
}

export async function getAccessRequests(adminKey: string) {
  const res = await fetch(`${API_BASE}/access/requests`, {
    headers: { 'X-Admin-Key': adminKey },
  })
  if (!res.ok) throw new Error('Unauthorized')
  return res.json()
}

export async function approveRequest(id: string, adminKey: string) {
  const res = await fetch(`${API_BASE}/access/requests/${id}/approve`, {
    method: 'POST',
    headers: { 'X-Admin-Key': adminKey },
  })
  if (!res.ok) throw new Error('Failed to approve')
  return res.json()
}

export async function rejectRequest(id: string, adminKey: string) {
  const res = await fetch(`${API_BASE}/access/requests/${id}/reject`, {
    method: 'POST',
    headers: { 'X-Admin-Key': adminKey },
  })
  if (!res.ok) throw new Error('Failed to reject')
  return res.json()
}

export async function resendApprovalEmail(id: string, adminKey: string) {
  const res = await fetch(`${API_BASE}/access/requests/${id}/resend-email`, {
    method: 'POST',
    headers: { 'X-Admin-Key': adminKey },
  })
  if (!res.ok) throw new Error('Failed to resend email')
  return res.json()
}

export async function deleteAccessRequest(id: string, adminKey: string) {
  const res = await fetch(`${API_BASE}/access/requests/${id}`, {
    method: 'DELETE',
    headers: { 'X-Admin-Key': adminKey },
  })
  if (!res.ok) throw new Error('Failed to delete request')
  return res.json()
}

export async function getApprovedUsers(adminKey: string) {
  const res = await fetch(`${API_BASE}/access/users`, {
    headers: { 'X-Admin-Key': adminKey },
  })
  if (!res.ok) throw new Error('Unauthorized')
  return res.json()
}

export async function deleteApprovedUser(email: string, adminKey: string) {
  const res = await fetch(`${API_BASE}/access/users/by-email/${encodeURIComponent(email)}`, {
    method: 'DELETE',
    headers: { 'X-Admin-Key': adminKey },
  })
  if (!res.ok) throw new Error('Failed to delete user')
  return res.json()
}
