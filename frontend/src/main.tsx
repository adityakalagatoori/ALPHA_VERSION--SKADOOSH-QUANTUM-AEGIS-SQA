import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import Landing from './pages/Landing'
import Login from './pages/Login'
import AdminLogin from './pages/AdminLogin'
import AdminPortal from './pages/AdminPortal'
import ProtectedRoute from './components/auth/ProtectedRoute'
import AdminRoute from './components/auth/AdminRoute'
import { UserProvider } from './context/UserContext'
import './index.css'
import './styles/kfp-theme.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <UserProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminRoute><AdminPortal /></AdminRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><App /></ProtectedRoute>} />
          <Route path="*" element={<Landing />} />
        </Routes>
      </BrowserRouter>
    </UserProvider>
  </React.StrictMode>
)
