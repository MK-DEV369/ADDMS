import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { useState } from 'react'
import {
  Menu,
  X,
  LayoutDashboard,
  Users,
  Plane,
  Package,
  MapPin,
  BarChart3,
  FileText,
  Navigation,
  LogOut,
  ChevronDown,
  Cloud,
} from 'lucide-react'
import ADDMS from '../store/ADDMS.png';

export default function DashboardLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    setIsUserMenuOpen(false)
    navigate('/home')
  }

  // Define navigation items based on user role
  const getNavigationItems = () => {
    const role = user?.role

    if (role === 'admin') {
      return [
        { name: 'Drones', path: '/admin/drones', icon: Plane },
        { name: 'Tracking', path: '/admin/tracking', icon: Navigation },
        { name: 'Users', path: '/admin/users', icon: Users },
        { name: 'Zones', path: '/admin/zones', icon: MapPin },
        { name: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
        { name: 'System Logs', path: '/admin/logs', icon: FileText },
      ]
    }

    if (role === 'manager') {
      return [
        { name: 'Fleet Monitor', path: '/manager', icon: LayoutDashboard },
        { name: 'Tracking', path: '/manager/tracking', icon: Navigation },
        { name: 'Deliveries', path: '/manager/deliveries', icon: Package },
        { name: 'Zones', path: '/manager/zones', icon: MapPin },
        { name: 'Weather', path: '/manager/weather', icon: Cloud },
        { name: 'Analytics', path: '/manager/analytics', icon: BarChart3 },
      ]
    }

    if (role === 'customer') {
      return [
        { name: 'Overview', path: '/customer/overview', icon: LayoutDashboard },
        { name: 'Orders', path: '/customer/orders', icon: Package },
        { name: 'Tracking', path: '/customer/tracking', icon: MapPin },
      ]
    }

    return []
  }

  const navigationItems = getNavigationItems()

  const isActivePath = (path: string) => {
    if (path === location.pathname) return true
    if (path !== '/admin' && path !== '/manager' && path !== '/customer') {
      return location.pathname.startsWith(path)
    }
    return false
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-white border-r border-gray-200 transition-all duration-300 ease-in-out flex flex-col`}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          {isSidebarOpen && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-[#e2feff] to-[#e2feff] rounded-lg flex items-center justify-center">
                <img src={ADDMS} alt="ADDMS Logo" className="w-5 h-5 rounded-lg" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                ADDMS
              </span>
            </div>
          )}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isSidebarOpen ? (
              <X className="w-5 h-5 text-gray-600" />
            ) : (
              <Menu className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = isActivePath(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600'
                }`}
              >
                <Icon
                  className={`w-5 h-5 flex-shrink-0 ${
                    isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-indigo-600'
                  }`}
                />
                {isSidebarOpen && (
                  <span className="ml-3 text-sm font-medium">{item.name}</span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* User Profile Section */}
        <div className="border-t border-gray-200 p-4 sticky bottom-0 bg-white">
          {isSidebarOpen ? (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform ${
                    isUserMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-20">

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full p-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
              title="Logout"
            >
              <LogOut className="w-5 h-5 text-gray-600" />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {navigationItems.find((item) => isActivePath(item.path))?.name || 'Dashboard'}
            </h2>
            <p className="text-sm text-gray-500">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>


    </div>
  )
}