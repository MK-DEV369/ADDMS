import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import api from '@/lib/api'
import { Eye, EyeOff, Loader2, Plane, X } from 'lucide-react'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Forgot password modal state
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotUsername, setForgotUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Registration modal state
  const [showRegister, setShowRegister] = useState(false)
  const [registerData, setRegisterData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'customer' as 'admin' | 'manager' | 'customer',
    firstName: '',
    lastName: '',
  })

  const { setAuth } = useAuthStore()
  const navigate = useNavigate()
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await api.post('/auth/login/', {
        username,
        password,
      })

      const { access, refresh } = response.data

      // Store tokens
      localStorage.setItem('access_token', access)
      if (rememberMe) {
        localStorage.setItem('refresh_token', refresh)
      } else {
        sessionStorage.setItem('refresh_token', refresh)
      }

      // Fetch user profile
      const userResponse = await api.get('/auth/profile/')
      const user = userResponse.data

      setAuth(user, access, refresh)

      // Redirect based on role
      const roleRoutes = {
        admin: '/admin',
        manager: '/manager',
        customer: '/customer'
      }

      navigate(roleRoutes[user.role as keyof typeof roleRoutes] || '/customer')
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail ||
                      err.response?.data?.message ||
                      'Login failed. Please check your credentials.'
      setError(errorMsg)
      console.error('Login error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setError('')
    setLoading(true)

    try {
      await api.post('/auth/forgot-password/', {
        username: forgotUsername,
        new_password: newPassword,
        new_password2: confirmPassword,
      })
      setError('Password reset successfully')
      setShowForgotPassword(false)
      setForgotUsername('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      const errorMsg = err.response?.data?.username?.[0] ||
                      err.response?.data?.new_password?.[0] ||
                      'Failed to reset password'
      setError(errorMsg)
      console.error('Forgot password error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (registerData.password !== registerData.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setError('')
    setLoading(true)

    try {
      await api.post('/auth/register/', {
        username: registerData.username,
        email: registerData.email,
        password: registerData.password,
        password2: registerData.confirmPassword,
        role: registerData.role,
        first_name: registerData.firstName,
        last_name: registerData.lastName,
      })
      setError('Registration successful! Please login.')
      setShowRegister(false)
      setRegisterData({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'customer',
        firstName: '',
        lastName: '',
      })
    } catch (err: any) {
      const errorMsg = err.response?.data?.username?.[0] ||
                      err.response?.data?.email?.[0] ||
                      err.response?.data?.password?.[0] ||
                      'Registration failed'
      setError(errorMsg)
      window.alert(errorMsg)
      console.error('Register error:', err)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4 py-12">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-2000"></div>
      </div>

      <div className="max-w-md w-full space-y-8 relative">
        {/* Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/20">
          {/* Logo & Header */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-4 shadow-lg transform hover:scale-105 transition-transform">
              <Plane className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome to ADDMS
            </h2>
            <p className="text-gray-600 text-sm">
              Autonomous Drone Delivery Management System
            </p>
          </div>

          {/* Form */}
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {/* Error Alert */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg animate-in slide-in-from-top-2">
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Username Field */}
            <div>
              <label 
                htmlFor="username" 
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Password Field */}
            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="block w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label 
                  htmlFor="remember-me" 
                  className="ml-2 block text-sm text-gray-700 cursor-pointer select-none"
                >
                  Remember me
                </label>
              </div>

              <button
                type="button"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
                onClick={() => setShowForgotPassword(true)}
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign in</span>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Don't have an account?
                </span>
              </div>
            </div>

            {/* Register Link */}
            <div className="mt-4 text-center">
              <button
                type="button"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
                onClick={() => setShowRegister(true)}
              >
                Create new account
              </button>
            </div>
          </div>
        </div>

        {/* Debug Info */}
        <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-gray-200">
          <p className="text-xs text-gray-600 text-center font-mono">
            <span className="font-semibold">Debug Credentials:</span><br />
            Admin (Superuser): <code className="bg-gray-100 px-1 py-0.5 rounded">admin / vijay159</code><br />
            Manager: <code className="bg-gray-100 px-1 py-0.5 rounded">manager1 / moryakantha</code><br />
            Customer: <code className="bg-gray-100 px-1 py-0.5 rounded">customer1 / mahantesh</code>
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Reset Password</h3>
              <button
                onClick={() => setShowForgotPassword(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  required
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg"
                  value={forgotUsername}
                  onChange={(e) => setForgotUsername(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Registration Modal */}
      {showRegister && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Create Account</h3>
              <button
                onClick={() => setShowRegister(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  required
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg"
                  value={registerData.username}
                  onChange={(e) => setRegisterData({...registerData, username: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  required
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  required
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg"
                  value={registerData.firstName}
                  onChange={(e) => setRegisterData({...registerData, firstName: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  required
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg"
                  value={registerData.lastName}
                  onChange={(e) => setRegisterData({...registerData, lastName: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Role
                </label>
                <select
                  required
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg"
                  value={registerData.role}
                  onChange={(e) => setRegisterData({...registerData, role: e.target.value as 'admin' | 'manager' | 'customer'})}
                >
                  <option value="customer">Customer</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  required
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg"
                  value={registerData.confirmPassword}
                  onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
