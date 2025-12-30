import { useState, useEffect } from 'react'
import {
  Package,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  Truck,
  Eye
} from 'lucide-react'
import { Order } from '@/lib/types'
import api, { getOrders, updateOrder as apiUpdateOrder } from '@/lib/api'

export default function Deliveries() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  // Fetch orders from API
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true)
        const res = await getOrders()
        const data = res.data.results || res.data
        setOrders(Array.isArray(data) ? data : [])
        console.debug('Fetched orders:', data)
      } catch (err: any) {
        console.error('Failed to fetch orders', err)
        alert('Failed to load deliveries. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500'
      case 'assigned': return 'bg-blue-500'
      case 'picked_up': return 'bg-purple-500'
      case 'in_transit': return 'bg-green-500'
      case 'delivered': return 'bg-green-700'
      case 'cancelled': return 'bg-red-500'
      case 'failed': return 'bg-red-700'
      default: return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle className="w-4 h-4" />
      case 'in_transit': return <Truck className="w-4 h-4" />
      case 'pending': return <Clock className="w-4 h-4" />
      case 'failed':
      case 'cancelled': return <AlertTriangle className="w-4 h-4" />
      default: return <Package className="w-4 h-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const pendingOrders = orders.filter(o => o.status === 'pending').length
  const inTransitOrders = orders.filter(o => o.status === 'in_transit' || o.status === 'assigned' || o.status === 'delivering').length
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length

  const handleAdvanceStatus = async (order: Order) => {
    const statuses = ['pending', 'assigned', 'in_transit', 'delivering', 'delivered']
    const currentIdx = statuses.indexOf(order.status)
    if (currentIdx === -1 || currentIdx >= statuses.length - 1) {
      alert('Order is already at final status')
      return
    }

    const nextStatus = statuses[currentIdx + 1]
    setUpdatingId(order.id as number)

    try {
      console.debug(`Advancing order ${order.id} from ${order.status} to ${nextStatus}`)
      const res = await apiUpdateOrder(order.id as number, { status: nextStatus })
      const updated = res.data
      setOrders(prev => prev.map(o => (o.id === updated.id ? updated : o)))
      alert(`Order advanced to ${nextStatus.replace('_', ' ')}`)
    } catch (err: any) {
      console.error('Failed to update order status', err)
      alert(`Failed to update order: ${err?.response?.data?.detail || err.message}`)
    } finally {
      setUpdatingId(null)
    }
  }

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
      <div className="flex items-center">
        <p className="text-gray-600 text-sm">Manage pending orders and advance their status</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Pending</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{pendingOrders}</p>
            </div>
            <Clock className="w-10 h-10 text-yellow-500" />
          </div>
          <p className="text-xs text-gray-600 mt-2">Awaiting assignment</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">In Transit</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{inTransitOrders}</p>
            </div>
            <Truck className="w-10 h-10 text-green-500" />
          </div>
          <p className="text-xs text-gray-600 mt-2">Currently delivering</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Delivered</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{deliveredOrders}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-blue-500" />
          </div>
          <p className="text-xs text-gray-600 mt-2">Completed today</p>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Active Deliveries</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4 flex-1">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(order.status)}`} />
                  <div>
                    <h3 className="font-medium">Order #{order.id}</h3>
                    <p className="text-sm text-gray-600">
                      {order.pickup_address || 'Pickup TBD'} → {order.delivery_address}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 capitalize`}>
                    {order.status.replace('_', ' ')}
                  </span>

                  <div className="text-sm text-gray-600">
                    {order.package?.weight}kg
                  </div>

                  <button
                    onClick={() => handleAdvanceStatus(order)}
                    disabled={updatingId === order.id || order.status === 'delivered'}
                    className="flex items-center space-x-2 px-3 py-1.5 border border-blue-300 rounded-lg text-blue-700 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {updatingId === order.id ? (
                      <span>Updating...</span>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>Next Status</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
