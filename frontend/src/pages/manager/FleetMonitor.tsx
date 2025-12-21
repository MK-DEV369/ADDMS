import { useState, useEffect } from 'react'
import {
  Plane,
  Battery,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Activity
} from 'lucide-react'
import { Drone } from '@/lib/types'

export default function FleetMonitor() {
  const [drones, setDrones] = useState<Drone[]>([])
  const [loading, setLoading] = useState(true)

  // Mock data - replace with real API call
  const mockDrones: Drone[] = [
    {
      id: 1,
      serial_number: 'DRONE-001',
      model: 'Quadcopter X1',
      manufacturer: 'DroneTech',
      max_payload_weight: 5,
      max_speed: 50,
      max_altitude: 120,
      max_range: 10,
      battery_capacity: 5000,
      status: 'delivering',
      battery_level: 85,
      current_position_lat: 12.9716,
      current_position_lng: 77.5946,
      current_altitude: 50,
      position: { lat: 12.9716, lng: 77.5946, altitude: 50 },
      heading: 90,
      pitch: 0,
      roll: 0,
      battery: 85,
      last_heartbeat: '2024-01-15T10:30:00Z',
      is_active: true
    },
    {
      id: 2,
      serial_number: 'DRONE-002',
      model: 'Quadcopter X1',
      manufacturer: 'DroneTech',
      max_payload_weight: 5,
      max_speed: 50,
      max_altitude: 120,
      max_range: 10,
      battery_capacity: 5000,
      status: 'idle',
      battery_level: 95,
      current_position_lat: 12.9816,
      current_position_lng: 77.6046,
      current_altitude: 0,
      position: { lat: 12.9816, lng: 77.6046, altitude: 0 },
      heading: 0,
      pitch: 0,
      roll: 0,
      battery: 95,
      last_heartbeat: '2024-01-15T10:25:00Z',
      is_active: true
    },
    {
      id: 3,
      serial_number: 'DRONE-003',
      model: 'Quadcopter X2',
      manufacturer: 'DroneTech',
      max_payload_weight: 8,
      max_speed: 60,
      max_altitude: 150,
      max_range: 15,
      battery_capacity: 6000,
      status: 'maintenance',
      battery_level: 15,
      current_position_lat: 12.9516,
      current_position_lng: 77.5746,
      current_altitude: 0,
      position: { lat: 12.9516, lng: 77.5746, altitude: 0 },
      heading: 0,
      pitch: 0,
      roll: 0,
      battery: 15,
      last_heartbeat: '2024-01-15T09:45:00Z',
      is_active: false
    },
    {
      id: 4,
      serial_number: 'DRONE-004',
      model: 'Quadcopter X1',
      manufacturer: 'DroneTech',
      max_payload_weight: 5,
      max_speed: 50,
      max_altitude: 120,
      max_range: 10,
      battery_capacity: 5000,
      status: 'charging',
      battery_level: 25,
      current_position_lat: 12.9616,
      current_position_lng: 77.5846,
      current_altitude: 0,
      position: { lat: 12.9616, lng: 77.5846, altitude: 0 },
      heading: 0,
      pitch: 0,
      roll: 0,
      battery: 25,
      last_heartbeat: '2024-01-15T10:20:00Z',
      is_active: true
    }
  ]

  useEffect(() => {
    setTimeout(() => {
      setDrones(mockDrones)
      setLoading(false)
    }, 1000)
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <TrendingUp className="w-4 h-4" />
          <span>View Analytics</span>
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
