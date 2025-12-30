import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/toaster'
import { useAuthStore } from '@/store/auth'
import HomePage from '@/pages/HomePage'
import LoginPage from '@/pages/LoginPage'
import DashboardLayout from '@/layouts/DashboardLayout'
import ProtectedRoute from '@/components/ProtectedRoute'

import SystemLogs from './pages/admin/SystemLogs'
import Drones from '@/pages/admin/Drones'
import UsersPage from '@/pages/admin/Users'
import Zones from '@/pages/admin/Zones'
import Analytics from '@/pages/admin/Analytics'

import FleetMonitor from '@/pages/manager/FleetMonitor'
import Deliveries from '@/pages/manager/Deliveries'
import ManagerZones from '@/pages/manager/Zones'
import Weather from '@/pages/manager/Weather'
import ManagerAnalytics from '@/pages/manager/Analytics'

import Overview from '@/pages/customer/Overview'
import Orders from '@/pages/customer/Orders'
import Tracking from '@/pages/customer/Tracking'


const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/home" element={<HomePage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<RoleBasedDashboard />} />
            <Route path="admin/*" element={
              <ProtectedRoute requiredRole="admin">
                <AdminRoutes />
              </ProtectedRoute>
            } />
            <Route path="manager/*" element={
              <ProtectedRoute requiredRole="manager">
                <ManagerRoutes />
              </ProtectedRoute>
            } />
            <Route path="customer/*" element={
              <ProtectedRoute requiredRole="customer">
                <CustomerRoutes />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

function RoleBasedDashboard() {
  const { user } = useAuthStore()

  if (user?.role === 'admin') {
    return <Navigate to="/admin/drones" replace />
  } else if (user?.role === 'manager') {
    return <Navigate to="/manager/fleet" replace />
  } else if (user?.role === 'customer') {
    return <Navigate to="/customer/overview" replace />
  }

  return <Navigate to="/login" replace />
}

function AdminRoutes() {
  return (
    <Routes>
      <Route index element={<Drones />} />
      <Route path="drones" element={<Drones />} />
      <Route path="users" element={<UsersPage />} />
      <Route path="zones" element={<Zones />} />
      <Route path="analytics" element={<Analytics />} />
      <Route path="logs" element={<SystemLogs />} />
    </Routes>
  )
}

function ManagerRoutes() {
  return (
    <Routes>
      <Route index element={<FleetMonitor />} />
      <Route path="fleet" element={<FleetMonitor />} />
      <Route path="deliveries" element={<Deliveries />} />
      <Route path="zones" element={<ManagerZones />} />
      <Route path="weather" element={<Weather />} />
      <Route path="analytics" element={<ManagerAnalytics />} />
    </Routes>
  )
}

function CustomerRoutes() {
  return (
    <Routes>
      <Route index element={<Overview />} />
      <Route path="overview" element={<Overview />} />
      <Route path="orders" element={<Orders />} />
      <Route path="tracking" element={<Tracking />} />
    </Routes>
  )
}

export default App

