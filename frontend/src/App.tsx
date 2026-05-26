import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import RequestAccess from './pages/RequestAccess'
import Login from './pages/Login'
import Admin from './pages/Admin'
import DemoMode from './pages/DemoMode'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/request-access" element={<RequestAccess />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/demo" element={<DemoMode />} />
      </Routes>
    </BrowserRouter>
  )
}
