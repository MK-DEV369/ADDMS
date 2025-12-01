import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/toaster'
import { useAuthStore } from '@/store/auth'
import LoginPage from '@/pages/LoginPage'
import DashboardLayout from '@/layouts/DashboardLayout'
import AdminDashboard from '@/pages/admin/AdminDashboard'
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
            <Route path="admin/*" element={<AdminRoutes />} />
            <Route path="manager/*" element={<ManagerRoutes />} />
            <Route path="customer/*" element={<CustomerRoutes />} />
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
    return <Navigate to="/admin" replace />
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
      <Route index element={<AdminDashboard />} />
      {/* Add more admin routes */}
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

