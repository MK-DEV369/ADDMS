import { useState, useEffect } from 'react'
import {
  Plane,
  Battery,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Activity,
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import { Drone } from '@/lib/types'
import { getDrones } from '@/lib/api'

export default function FleetMonitor() {
  const [drones, setDrones] = useState<Drone[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  // Fetch drones from API
  const fetchDrones = async () => {
    try {
      setError(null)
      const res = await getDrones()
      const data = res.data.results || res.data
      
      // Normalize PostGIS Point field if present
      const normalizedDrones = (Array.isArray(data) ? data : []).map((drone: any) => {
        if (drone.current_position && drone.current_position.coordinates) {
          const [lng, lat] = drone.current_position.coordinates
          return {
            ...drone,
            current_position_lng: lng,
            current_position_lat: lat,
            position: { lat, lng, altitude: drone.current_altitude || 0 }
          }
        }
        return drone
      })
      
      setDrones(normalizedDrones)
      console.debug('Fetched drones:', normalizedDrones)
    } catch (err: any) {
      console.error('Failed to fetch drones', err)
      setError(err?.response?.data?.detail || 'Failed to load drone data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchDrones()
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(() => {
      fetchDrones()
    }, 10000)
    
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'delivering': return 'bg-green-500'
      case 'idle': return 'bg-yellow-500'
      case 'maintenance': return 'bg-orange-500'
      case 'charging': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'delivering': return <CheckCircle className="w-4 h-4" />
      case 'idle': return <Clock className="w-4 h-4" />
      case 'maintenance': return <AlertTriangle className="w-4 h-4" />
      case 'charging': return <Battery className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  const activeDrones = drones.filter(d => d.status === 'delivering').length
  const idleDrones = drones.filter(d => d.status === 'idle').length
  const maintenanceDrones = drones.filter(d => d.status === 'maintenance').length
  const lowBatteryDrones = drones.filter(d => (d.battery_level || 0) < 20).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={() => {
              setLoading(true)
              setError(null)
              fetchDrones()
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Fleet Monitor {drones.length} Drones</h2>
        <button
          onClick={() => {
            setRefreshing(true)
            fetchDrones()
          }}
          disabled={refreshing}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Active Drones</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{activeDrones}</p>
            </div>
            <Plane className="w-10 h-10 text-green-500" />
          </div>
          <p className="text-xs text-gray-600 mt-2">Currently delivering</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Idle Drones</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{idleDrones}</p>
            </div>
            <Clock className="w-10 h-10 text-yellow-500" />
          </div>
          <p className="text-xs text-gray-600 mt-2">Available for assignment</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Maintenance</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">{maintenanceDrones}</p>
            </div>
            <AlertTriangle className="w-10 h-10 text-orange-500" />
          </div>
          <p className="text-xs text-gray-600 mt-2">Under maintenance</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Low Battery</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{lowBatteryDrones}</p>
            </div>
            <Battery className="w-10 h-10 text-red-500" />
          </div>
          <p className="text-xs text-gray-600 mt-2">Need charging</p>
        </div>
      </div>

      {/* Drone List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Drone Status</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {drones.map((drone) => (
              <div key={drone.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(drone.status)}`} />
                  <div>
                    <h3 className="font-medium">{drone.serial_number}</h3>
                    <p className="text-sm text-gray-600">{drone.model}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(drone.status)}
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 capitalize">
                      {drone.status}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Battery className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium">{drone.battery_level}%</span>
                  </div>

                  {drone.position && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-600">
                        {drone.position.lat.toFixed(4)}, {drone.position.lng.toFixed(4)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
