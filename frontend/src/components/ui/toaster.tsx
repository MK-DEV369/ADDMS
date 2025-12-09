/**
 * Toast notification component
 * Displays toast notifications with animations and auto-dismiss
 */
import { useEffect, useState } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

export interface Toast {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

// Global toast state
let toastListeners: Array<(toast: Toast) => void> = []
let toastId = 0

// Toast API
export const toast = {
  success: (message: string, title?: string) => {
    addToast({
      id: String(toastId++),
      title: title || 'Success',
      description: message,
      variant: 'success',
      duration: 3000,
    })
  },
  error: (message: string, title?: string) => {
    addToast({
      id: String(toastId++),
      title: title || 'Error',
      description: message,
      variant: 'error',
      duration: 5000,
    })
  },
  warning: (message: string, title?: string) => {
    addToast({
      id: String(toastId++),
      title: title || 'Warning',
      description: message,
      variant: 'warning',
      duration: 4000,
    })
  },
  info: (message: string, title?: string) => {
    addToast({
      id: String(toastId++),
      title: title || 'Info',
      description: message,
      variant: 'info',
      duration: 3000,
    })
  },
  custom: (options: Omit<Toast, 'id'>) => {
    addToast({
      id: String(toastId++),
      ...options,
    })
  },
}

function addToast(toast: Toast) {
  toastListeners.forEach((listener) => listener(toast))
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const listener = (toast: Toast) => {
      setToasts((prev) => [...prev, toast])

      // Auto dismiss
      if (toast.duration) {
        setTimeout(() => {
          removeToast(toast.id)
        }, toast.duration)
      }
    }

    toastListeners.push(listener)

    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener)
    }
  }, [])

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
      ))}
    </div>
  )
}

interface ToastItemProps {
  toast: Toast
  onClose: () => void
}

function ToastItem({ toast, onClose }: ToastItemProps) {
  const [isExiting, setIsExiting] = useState(false)

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(onClose, 200)
  }

  const variants = {
    default: {
      bg: 'bg-gray-900 border-gray-800',
      icon: <Info className="h-5 w-5 text-blue-400" />,
    },
    success: {
      bg: 'bg-green-950 border-green-800',
      icon: <CheckCircle className="h-5 w-5 text-green-400" />,
    },
    error: {
      bg: 'bg-red-950 border-red-800',
      icon: <AlertCircle className="h-5 w-5 text-red-400" />,
    },
    warning: {
      bg: 'bg-yellow-950 border-yellow-800',
      icon: <AlertTriangle className="h-5 w-5 text-yellow-400" />,
    },
    info: {
      bg: 'bg-blue-950 border-blue-800',
      icon: <Info className="h-5 w-5 text-blue-400" />,
    },
  }

  const variant = variants[toast.variant || 'default']

  return (
    <div
      className={`
        pointer-events-auto flex items-start gap-3 p-4 rounded-lg border shadow-lg
        ${variant.bg}
        transition-all duration-200
        ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}
        animate-in slide-in-from-right
      `}
    >
      <div className="flex-shrink-0 mt-0.5">{variant.icon}</div>
      <div className="flex-1 min-w-0">
        {toast.title && (
          <div className="font-semibold text-white text-sm mb-1">{toast.title}</div>
        )}
        {toast.description && (
          <div className="text-gray-300 text-sm">{toast.description}</div>
        )}
      </div>
      <button
        onClick={handleClose}
        className="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
        aria-label="Close notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
/**
 * 
//  * Protected Route Component
//  * Handles authentication and role-based access control
 
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


# Get the default dashboard path for a user role

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


//  * Higher-order component for protecting routes
//  * Usage: export default withAuth(MyComponent, { requiredRole: 'admin' })

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


//  * Hook to check if user has specific permission
//  * Usage: const canEdit = usePermission('drone:edit')
 
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


//  * Component to conditionally render based on permission
//  * Usage: <Authorized permission="drone:edit">...</Authorized>
 
interface AuthorizedProps {
  children: React.ReactNode
  permission: string
  fallback?: React.ReactNode
}

export function Authorized({ children, permission, fallback = null }: AuthorizedProps) {
  const hasPermission = usePermission(permission)
  return hasPermission ? <>{children}</> : <>{fallback}</>
}
*/