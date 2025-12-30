import axios from 'axios'
import { Drone } from './types'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // If error is 401 and we haven't tried refreshing yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refresh_token')
        
        if (!refreshToken) {
          // No refresh token, redirect to login
          localStorage.clear()
          window.location.href = '/login'
          return Promise.reject(error)
        }

        // Try to refresh the token
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/token/refresh/`,
          { refresh: refreshToken }
        )

        const { access } = response.data
        localStorage.setItem('access_token', access)

        // Retry the original request with new token
        originalRequest.headers.Authorization = `Bearer ${access}`
        return api(originalRequest)
      } catch (refreshError) {
        // Refresh failed, clear storage and redirect to login
        localStorage.clear()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default api

export const getDrones = () => api.get('/drones/drones/')
export const addDrone = (droneData: Drone) => api.post('/drones/drones/', droneData)
export const updateDrone = (id: number, droneData: Partial<Drone>) => api.put(`/drones/drones/${id}/`, droneData)
export const deleteDrone = (id: number) => api.delete(`/drones/drones/${id}/`)

export const getUsers = () => api.get('/auth/users/')
export const addUser = (userData: { username: string; email?: string; role?: string; is_active?: boolean; first_name?: string; last_name?: string; phone_number?: string; address?: string }) => api.post('/auth/users/', userData)
export const updateUser = (id: number, userData: any) => api.put(`/auth/users/${id}/`, userData)
export const deleteUser = (id: number) => api.delete(`/auth/users/${id}/`)

export const getOrders = () => api.get('/deliveries/orders/')
export const addOrder = (orderData: any) => api.post('/deliveries/orders/', orderData)
export const updateOrder = (id: number | string, orderData: any) => api.patch(`/deliveries/orders/${id}/`, orderData)
export const deleteOrder = (id: number | string) => api.delete(`/deliveries/orders/${id}/`)

export const getRoutes = (params?: { delivery_order?: number | string; optimization_method?: string }) =>
  api.get('/routes/routes/', { params })

export const getOperationalZones = (params?: { is_active?: boolean }) =>
  api.get('/zones/operational/', { params })

export const getNoFlyZones = (params?: { is_active?: boolean; zone_type?: string }) =>
  api.get('/zones/no-fly/', { params })
