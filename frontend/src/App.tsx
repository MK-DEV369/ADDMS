import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/toaster'
import { useAuthStore } from '@/store/auth'
import LoginPage from '@/pages/LoginPage'
import DashboardLayout from '@/layouts/DashboardLayout'
import SystemLogs from './pages/admin/SystemLogs'
import Drones from '@/pages/admin/Drones'
import UsersPage from '@/pages/admin/Users'
import Zones from '@/pages/admin/Zones'
import Analytics from '@/pages/admin/Analytics'
import ManagerDashboard from '@/pages/manager/ManagerDashboard'
import CustomerDashboard from '@/pages/customer/CustomerDashboard'
import ProtectedRoute from '@/components/ProtectedRoute'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
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
    return <Navigate to="/manager" replace />
  } else if (user?.role === 'customer') {
    return <Navigate to="/customer" replace />
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
      <Route index element={<ManagerDashboard />} />
      {/* Add more manager routes */}
    </Routes>
  )
}

function CustomerRoutes() {
  return (
    <Routes>
      <Route index element={<CustomerDashboard />} />
      {/* Add more customer routes */}
    </Routes>
  )
}

export default App

