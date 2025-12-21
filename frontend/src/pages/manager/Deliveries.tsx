import { useState, useEffect } from 'react'
import {
  Package,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  Truck,
  Eye,
  Plus
} from 'lucide-react'
import { Order } from '@/lib/types'

export default function Deliveries() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  // Mock data - replace with real API call
  useEffect(() => {
    const mockOrders: Order[] = [
      {
        id: 1,
        customerId: 1,
        pickupLocation: {
          lat: 12.9716,
          lng: 77.5946,
          address: '123 Main St, Bangalore'
        },
        deliveryLocation: {
          lat: 12.9816,
          lng: 77.6046,
          address: '456 Oak Ave, Bangalore'
        },
        packageDetails: {
          weight: 2.5,
          description: 'Electronics package',
          value: 150.00
        },
        priority: 'high',
        status: 'in_transit',
        assignedDroneId: 1,
        estimatedDeliveryTime: new Date(Date.now() + 1800000).toISOString(), // 30 min from now
        trackingNumber: 'DEL001',
        createdAt: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
      },
      {
        id: 2,
        customerId: 2,
        pickupLocation: {
          lat: 12.9616,
          lng: 77.5846,
          address: '789 Pine St, Bangalore'
        },
        deliveryLocation: {
          lat: 12.9916,
          lng: 77.6146,
          address: '321 Elm St, Bangalore'
        },
        packageDetails: {
          weight: 1.2,
          description: 'Documents',
          value: 50.00
        },
        priority: 'medium',
        status: 'pending',
        estimatedDeliveryTime: new Date(Date.now() + 7200000).toISOString(), // 2 hours from now
        trackingNumber: 'DEL002',
        createdAt: new Date(Date.now() - 1800000).toISOString() // 30 min ago
      },
      {
        id: 3,
        customerId: 3,
        pickupLocation: {
          lat: 12.9516,
          lng: 77.5746,
          address: '555 Cedar St, Bangalore'
        },
        deliveryLocation: {
          lat: 12.9416,
          lng: 77.5646,
          address: '777 Maple Ave, Bangalore'
        },
        packageDetails: {
          weight: 0.8,
          description: 'Medicine',
          value: 75.00
        },
        priority: 'urgent',
        status: 'delivered',
        assignedDroneId: 2,
        actualDeliveryTime: new Date(Date.now() - 900000).toISOString(), // 15 min ago
        trackingNumber: 'DEL003',
        createdAt: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
      }
    ]

    setTimeout(() => {
      setOrders(mockOrders)
      setLoading(false)
    }, 1000)
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
  const inTransitOrders = orders.filter(o => o.status === 'in_transit').length
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length

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
        <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          <span>New Delivery</span>
        </button>
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
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(order.status)}`} />
                  <div>
                    <h3 className="font-medium">Order #{order.trackingNumber}</h3>
                    <p className="text-sm text-gray-600">
                      {order.pickupLocation.address} → {order.deliveryLocation.address}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(order.priority)}`}>
                    {order.priority}
                  </span>

                  <div className="flex items-center space-x-2">
                    {getStatusIcon(order.status)}
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 capitalize">
                      {order.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="text-sm text-gray-600">
                    {order.packageDetails.weight}kg • ${order.packageDetails.value}
                  </div>

                  <button className="flex items-center space-x-2 px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                    <Eye className="w-4 h-4" />
                    <span>View</span>
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
