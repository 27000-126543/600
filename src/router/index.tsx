import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import useAuthStore from '@/store/useAuthStore'
import MainLayout from '@/components/layout/MainLayout'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import CityDetailPage from '@/pages/CityDetailPage'
import BranchDetailPage from '@/pages/BranchDetailPage'
import WarningCenterPage from '@/pages/WarningCenterPage'
import SchedulePage from '@/pages/SchedulePage'
import ReportsPage from '@/pages/ReportsPage'
import MonitorPage from '@/pages/MonitorPage'

function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <MainLayout />
}

function RoleRoute({ permission }: { permission: string }) {
  const hasPermission = useAuthStore((s) => s.hasPermission)
  if (!hasPermission(permission)) return <Navigate to="/dashboard" replace />
  return <Outlet />
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route element={<RoleRoute permission="view_city" />}>
            <Route path="/city/:cityId" element={<CityDetailPage />} />
          </Route>
          <Route path="/branch/:branchId" element={<BranchDetailPage />} />
          <Route path="/warnings" element={<WarningCenterPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route element={<RoleRoute permission="view_monitor" />}>
            <Route path="/monitor" element={<MonitorPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
