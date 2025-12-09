/**
 * Protected Route Component
 * Handles authentication and role-based access control
 */
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { toast } from '@/components/ui/toaster'
import { useEffect, useState } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'manager' | 'customer'
  requiredRoles?: Array<'admin' | 'manager' | 'customer'>
  requireAuth?: boolean
}

export default function ProtectedRoute({ 
  children, 
  requiredRole,
  requiredRoles,
  requireAuth = true 
}: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore()
  const location = useLocation()
  const [hasShownToast, setHasShownToast] = useState(false)

  // Check if user is authenticated
  const authenticated = isAuthenticated()

  // Check if user has required role
  const hasRequiredRole = () => {
    if (!user) return false
    
    // Check single required role
    if (requiredRole && user.role !== requiredRole) {
      return false
    }
    
    // Check multiple allowed roles
    if (requiredRoles && !requiredRoles.includes(user.role)) {
      return false
    }
    
    return true
  }

  useEffect(() => {
    // Show toast notification for unauthorized access (only once)
    if (!hasShownToast) {
      if (requireAuth && !authenticated) {
        toast.warning('Please log in to access this page', 'Authentication Required')
        setHasShownToast(true)
      } else if (authenticated && !hasRequiredRole()) {
        toast.error('You do not have permission to access this page', 'Access Denied')
        setHasShownToast(true)
      }
    }
  }, [authenticated, hasShownToast, requireAuth])

  // Not authenticated - redirect to login
  if (requireAuth && !authenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  // Authenticated but wrong role - redirect to appropriate dashboard
  if (authenticated && !hasRequiredRole()) {
    const redirectPath = getRoleDashboard(user?.role)
    return <Navigate to={redirectPath} replace />
  }

  // All checks passed - render children
  return <>{children}</>
}

/**
 * Get the default dashboard path for a user role
 */
function getRoleDashboard(role?: string): string {
  switch (role) {
    case 'admin':
      return '/admin/dashboard'
    case 'manager':
      return '/manager/dashboard'
    case 'customer':
      return '/customer/dashboard'
    default:
      return '/login'
  }
}

/**
 * Higher-order component for protecting routes
 * Usage: export default withAuth(MyComponent, { requiredRole: 'admin' })
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    requiredRole?: 'admin' | 'manager' | 'customer'
    requiredRoles?: Array<'admin' | 'manager' | 'customer'>
  }
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute 
        requiredRole={options?.requiredRole}
        requiredRoles={options?.requiredRoles}
      >
        <Component {...props} />
      </ProtectedRoute>
    )
  }
}

/**
 * Hook to check if user has specific permission
 * Usage: const canEdit = usePermission('drone:edit')
 */
export function usePermission(permission: string): boolean {
  const { user } = useAuthStore()
  
  if (!user) return false

  // Define role-based permissions
  const rolePermissions: Record<string, string[]> = {
    admin: [
      'drone:create', 'drone:read', 'drone:update', 'drone:delete',
      'user:create', 'user:read', 'user:update', 'user:delete',
      'zone:create', 'zone:read', 'zone:update', 'zone:delete',
      'delivery:create', 'delivery:read', 'delivery:update', 'delivery:delete',
      'analytics:read',
      'logs:read',
    ],
    manager: [
      'drone:read', 'drone:update',
      'zone:read', 'zone:update',
      'delivery:create', 'delivery:read', 'delivery:update',
      'analytics:read',
    ],
    customer: [
      'delivery:create', 'delivery:read',
    ],
  }

  const userPermissions = rolePermissions[user.role] || []
  return userPermissions.includes(permission)
}

/**
 * Component to conditionally render based on permission
 * Usage: <Authorized permission="drone:edit">...</Authorized>
 */
interface AuthorizedProps {
  children: React.ReactNode
  permission: string
  fallback?: React.ReactNode
}

export function Authorized({ children, permission, fallback = null }: AuthorizedProps) {
  const hasPermission = usePermission(permission)
  return hasPermission ? <>{children}</> : <>{fallback}</>
}