import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import ApplicationDetail from './pages/ApplicationDetail'
import StaffInfoForm from './pages/StaffInfoForm'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/application/:id" element={<ApplicationDetail />} />
        <Route path="/staff-info" element={<StaffInfoForm />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
