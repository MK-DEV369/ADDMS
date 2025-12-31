import { useState, useEffect, useMemo } from 'react'
import {
  Plane,
  Battery,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import { Drone, Order } from '@/lib/types'
import { getDrones, getOrders, updateOrder, patchDrone } from '@/lib/api'

type SortKey = 'status' | 'battery' | 'lastHeartbeat' | 'serial'

const DRONE_STATUS_OPTIONS: { value: Drone['status']; label: string }[] = [
  { value: 'idle', label: 'Idle' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'delivering', label: 'Delivering' },
  { value: 'returning', label: 'Returning' },
  { value: 'charging', label: 'Charging' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'offline', label: 'Offline' },
]

const STATUS_PRIORITY: Record<string, number> = {
  delivering: 0,
  assigned: 1,
  returning: 2,
  charging: 3,
  idle: 4,
  maintenance: 5,
  offline: 6,
}

const ACTIVE_STATUSES = ['assigned', 'delivering', 'returning', 'charging']

const SORT_OPTIONS = [
  { value: 'status', label: 'Status (priority)' },
  { value: 'battery', label: 'Battery' },
  { value: 'lastHeartbeat', label: 'Last Update' },
  { value: 'serial', label: 'Serial Number' },
]

export default function FleetMonitor() {
  const [drones, setDrones] = useState<Drone[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [sortBy, setSortBy] = useState<SortKey>('status')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [updatingDroneId, setUpdatingDroneId] = useState<number | null>(null)

  const fetchDrones = async () => {
    const res = await getDrones()
    const data = res.data.results || res.data

    const normalizedDrones = (Array.isArray(data) ? data : []).map((drone: any) => {
      const batteryLevel = Number(drone.battery_level ?? drone.battery ?? 0)
      const base: Drone = {
        ...drone,
        battery_level: Number.isNaN(batteryLevel) ? 0 : batteryLevel,
        status: drone.status || 'idle',
        last_heartbeat: drone.last_heartbeat || '—',
      }

      if (drone.current_position && drone.current_position.coordinates) {
        const [lng, lat] = drone.current_position.coordinates
        base.current_position_lng = lng
        base.current_position_lat = lat
        base.position = { lat, lng, altitude: drone.current_altitude || 0 }
      } else if (!drone.position) {
        base.position = {
          lat: Number(drone.current_position_lat ?? 0),
          lng: Number(drone.current_position_lng ?? 0),
          altitude: Number(drone.current_altitude ?? 0),
        }
      }

      return base
    })

    setDrones(normalizedDrones)
    console.debug('Fetched drones:', normalizedDrones)
  }

  const fetchOrders = async () => {
    const res = await getOrders()
    const data = res.data.results || res.data
    setOrders(Array.isArray(data) ? data : [])
  }

  const fetchAll = async (withSpinner = false) => {
    try {
      setError(null)
      if (withSpinner) setRefreshing(true)
      await Promise.all([fetchDrones(), fetchOrders()])
    } catch (err: any) {
      console.error('Failed to fetch fleet data', err)
      setError(err?.response?.data?.detail || 'Failed to load drone data')
    } finally {
      if (withSpinner) setRefreshing(false)
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()

    // Auto-refresh every 10 seconds
    const interval = setInterval(() => {
      fetchAll()
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

  const activeDrones = drones.filter(d => ACTIVE_STATUSES.includes(d.status || '')).length
  const idleDrones = drones.filter(d => d.status === 'idle').length
  const maintenanceDrones = drones.filter(d => d.status === 'maintenance').length
  const lowBatteryDrones = drones.filter(d => (d.battery_level || 0) < 20).length

  const sortedDrones = useMemo(() => {
    const direction = sortDir === 'asc' ? 1 : -1

    return [...drones].sort((a, b) => {
      switch (sortBy) {
        case 'status': {
          const rankA = STATUS_PRIORITY[a.status || 'idle'] ?? 99
          const rankB = STATUS_PRIORITY[b.status || 'idle'] ?? 99
          return direction * (rankA - rankB)
        }
        case 'battery': {
          const diff = (a.battery_level ?? 0) - (b.battery_level ?? 0)
          return direction * diff
        }
        case 'lastHeartbeat': {
          const tsA = a.last_heartbeat ? new Date(a.last_heartbeat).getTime() : 0
          const tsB = b.last_heartbeat ? new Date(b.last_heartbeat).getTime() : 0
          const safeA = Number.isNaN(tsA) ? 0 : tsA
          const safeB = Number.isNaN(tsB) ? 0 : tsB
          return direction * (safeB - safeA)
        }
        case 'serial':
        default:
          return direction * a.serial_number.localeCompare(b.serial_number)
      }
    })
  }, [drones, sortBy, sortDir])

  const getCurrentOrderForDrone = (droneId?: number) =>
    orders.find((order) => order.drone === droneId)

  const availableOrdersForDrone = (droneId?: number) =>
    orders.filter(
      (order) =>
        !['delivered', 'failed', 'cancelled'].includes(order.status) &&
        (!order.drone || order.drone === droneId)
    )

  const formatOrderLabel = (order: Order) => {
    const humanStatus = order.status.replace(/_/g, ' ')
    const packageName = (order as any).package?.name || order.delivery_address || 'Order'
    const etaText = order.estimated_eta ? new Date(order.estimated_eta).toLocaleTimeString() : 'ETA TBD'
    const costText = order.total_cost != null ? `₹${order.total_cost.toFixed(0)}` : 'Cost?'
    return `#${order.id} - ${packageName} - ${humanStatus} - ${etaText} - ${costText}`
  }

  const handleStatusChange = async (droneId: number, nextStatus: Drone['status']) => {
    if (!droneId) return

    try {
      setUpdatingDroneId(droneId)
      await patchDrone(droneId, { status: nextStatus })
      await fetchDrones()
    } catch (err) {
      console.error('Failed to update drone status', err)
      setError('Unable to update status')
    } finally {
      setUpdatingDroneId(null)
    }
  }

  const handleAssignOrder = async (drone: Drone, newOrderId: number | null) => {
    if (!drone.id) return
    const currentOrder = getCurrentOrderForDrone(drone.id)
    if (currentOrder?.id === newOrderId) return

    try {
      setUpdatingDroneId(drone.id)

      if (currentOrder && currentOrder.id && currentOrder.id !== newOrderId) {
        await updateOrder(currentOrder.id, { drone: null, status: 'pending' })
      }

      if (newOrderId) {
        await updateOrder(newOrderId, { drone: drone.id, status: 'assigned' })
        if (!['assigned', 'delivering', 'returning'].includes(drone.status || '')) {
          await patchDrone(drone.id, { status: 'assigned' })
        }
      } else if (!['maintenance', 'offline'].includes(drone.status || '')) {
        await patchDrone(drone.id, { status: 'idle' })
      }

      await Promise.all([fetchDrones(), fetchOrders()])
    } catch (err) {
      console.error('Failed to update assignment', err)
      setError('Unable to update assignment')
    } finally {
      setUpdatingDroneId(null)
    }
  }

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
              fetchAll(true)
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-gray-900">Fleet Monitor {drones.length} Drones</h2>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Sort</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
          >
            {sortDir === 'asc' ? 'Asc' : 'Desc'}
          </button>
          <button
            onClick={() => fetchAll(true)}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
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
          <p className="text-xs text-gray-600 mt-2">In operation or charging</p>
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
            {sortedDrones.map((drone) => {
              const currentOrder = getCurrentOrderForDrone(drone.id)
              const availableOrders = availableOrdersForDrone(drone.id)

              return (
                <div
                  key={drone.id}
                  className="flex flex-col gap-3 p-4 border rounded-lg md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(drone.status)}`} />
                    <div>
                      <h3 className="font-medium">{drone.serial_number}</h3>
                      <p className="text-sm text-gray-600">{drone.model}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 justify-end">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(drone.status)}
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 capitalize">
                        {drone.status}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Battery className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium">{drone.battery_level ?? 0}%</span>
                    </div>

                    {drone.position && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4 text-gray-600" />
                        <span>
                          {drone.position.lat.toFixed(4)}, {drone.position.lng.toFixed(4)}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">Status</span>
                      <select
                        value={drone.status}
                        onChange={(e) => handleStatusChange(drone.id || 0, e.target.value as Drone['status'])}
                        disabled={!drone.id || updatingDroneId === drone.id}
                        className="px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        {DRONE_STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">Order</span>
                      <select
                        value={currentOrder?.id || ''}
                        onChange={(e) => handleAssignOrder(drone, e.target.value ? Number(e.target.value) : null)}
                        disabled={updatingDroneId === drone.id}
                        className="px-3 py-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="">Unassigned</option>
                        {availableOrders.map((order) => (
                          <option key={order.id} value={order.id}>
                            {formatOrderLabel(order)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
