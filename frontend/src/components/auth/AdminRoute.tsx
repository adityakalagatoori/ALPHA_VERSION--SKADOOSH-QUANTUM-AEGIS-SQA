import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'

export default function AdminRoute({ children }: { children: ReactNode }) {
  const isAdmin = sessionStorage.getItem('sqa_admin_verified') === 'true'
  if (!isAdmin) return <Navigate to="/admin/login" replace />
  return <>{children}</>
}
