import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import {
  Package, MapPin, Clock, DollarSign, ChevronRight,
  Plus, Bell, CheckCircle, Navigation, Zap, LogOut, User, ChevronDown,
  XCircle, Star, TrendingUp, Download
} from 'lucide-react';
import Map3D from '../../components/Map3D';
import { Drone } from '@/lib/types';

// Types
interface Order {
  id: string;
  pickupAddress: string;
  deliveryAddress: string;
  status: 'pending' | 'assigned' | 'in_transit' | 'delivered' | 'cancelled';
  packageWeight: number;
  estimatedCost: number;
  eta: string;
  droneId?: string;
  createdAt: string;
  completedAt?: string;
  rating?: number;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
}

// Mock Data
const mockOrders: Order[] = [
  {
    id: 'ORD-001',
    pickupAddress: '123 Tech Park, Bangalore',
    deliveryAddress: '456 MG Road, Bangalore',
    status: 'in_transit',
    packageWeight: 2.5,
    estimatedCost: 250,
    eta: new Date(Date.now() + 15 * 60000).toISOString(),
    droneId: 'DRN-042',
    createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
  },
  {
    id: 'ORD-002',
    pickupAddress: '789 Koramangala, Bangalore',
    deliveryAddress: '321 Indiranagar, Bangalore',
    status: 'delivered',
    packageWeight: 1.2,
    estimatedCost: 180,
    eta: new Date(Date.now() - 120 * 60000).toISOString(),
    droneId: 'DRN-015',
    createdAt: new Date(Date.now() - 180 * 60000).toISOString(),
    completedAt: new Date(Date.now() - 120 * 60000).toISOString(),
    rating: 5,
  },
];

const mockNotifications: Notification[] = [
  {
    id: 'N1',
    title: 'Delivery In Progress',
    message: 'Your order ORD-001 is on the way. ETA: 15 minutes',
    type: 'info',
    timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
    read: false,
  },
  {
    id: 'N2',
    title: 'Order Delivered',
    message: 'Order ORD-002 has been successfully delivered',
    type: 'success',
    timestamp: new Date(Date.now() - 120 * 60000).toISOString(),
    read: true,
  },
];

// Status Badge Component
const StatusBadge: React.FC<{ status: Order['status'] }> = ({ status }) => {
  const styles = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    assigned: 'bg-blue-100 text-blue-800 border-blue-200',
    in_transit: 'bg-purple-100 text-purple-800 border-purple-200',
    delivered: 'bg-green-100 text-green-800 border-green-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
  };

  const icons = {
    pending: Clock,
    assigned: CheckCircle,
    in_transit: Navigation,
    delivered: CheckCircle,
    cancelled: XCircle,
  };

  const Icon = icons[status];

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
      <Icon className="w-3 h-3" />
      {status.replace('_', ' ').toUpperCase()}
    </span>
  );
};

// ETA Countdown Component
const ETACountdown: React.FC<{ eta: string; status: Order['status'] }> = ({ eta, status }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (status !== 'in_transit') return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const etaTime = new Date(eta).getTime();
      const diff = etaTime - now;

      if (diff <= 0) {
        setTimeLeft('Arriving now');
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${minutes}m ${seconds}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [eta, status]);

  if (status !== 'in_transit') return null;

  return (
    <div className="flex items-center gap-2 text-purple-700">
      <Zap className="w-4 h-4 animate-pulse" />
      <span className="font-semibold">ETA: {timeLeft}</span>
    </div>
  );
};

interface Route {
  id: number
  path: Array<{ lat: number; lng: number; altitude: number }>
  color?: string
  completed?: boolean
}

interface Zone {
  id: number
  name: string
  type: 'operational' | 'no-fly'
  polygon: Array<{ lat: number; lng: number }>
  altitudeRange?: { min: number; max: number }
}

// Main Overview Component
export default function Overview() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const [orders] = useState<Order[]>(mockOrders);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Dynamic drone tracking data
  const [drones, setDrones] = useState<Drone[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const activeOrders = orders.filter(o => ['pending', 'assigned', 'in_transit'].includes(o.status));

  // Initialize mock drone tracking data
  useEffect(() => {
    // Mock zones
    const mockZones: Zone[] = [
      {
        id: 1,
        name: 'Bangalore Operational Zone',
        type: 'operational',
        polygon: [
          { lat: 12.8, lng: 77.4 },
          { lat: 12.8, lng: 77.8 },
          { lat: 13.2, lng: 77.8 },
          { lat: 13.2, lng: 77.4 },
        ],
        altitudeRange: { min: 50, max: 200 },
      },
      {
        id: 2,
        name: 'Airport No-Fly Zone',
        type: 'no-fly',
        polygon: [
          { lat: 13.0, lng: 77.6 },
          { lat: 13.0, lng: 77.7 },
          { lat: 13.1, lng: 77.7 },
          { lat: 13.1, lng: 77.6 },
        ],
        altitudeRange: { min: 0, max: 1000 },
      },
    ];

    setZones(mockZones);

    // Mock drones based on active orders
    const mockDrones: Drone[] = activeOrders.map((order, index) => {
      const droneId = parseInt(order.droneId!.split('-')[1]);
      return {
        id: droneId,
        serial_number: order.droneId!,
        model: 'DJI Matrice 300 RTK',
        manufacturer: 'DJI',
        max_payload_weight: 2.7,
        max_speed: 23,
        max_altitude: 7000,
        max_range: 15000,
        battery_capacity: 5935,
        position: {
          lat: 12.9716 + (Math.random() - 0.5) * 0.1, // Bangalore area
          lng: 77.5946 + (Math.random() - 0.5) * 0.1,
          altitude: 100 + Math.random() * 50,
        },
        heading: Math.random() * 360,
        status: order.status === 'in_transit' ? 'delivering' : 'idle',
        battery_level: 60 + Math.random() * 30,
        last_heartbeat: new Date().toISOString(),
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    });

    setDrones(mockDrones);

    // Mock routes for active deliveries
    const mockRoutes: Route[] = activeOrders.map((order, index) => {
      const droneId = parseInt(order.droneId!.split('-')[1]);
      return {
        id: droneId,
        path: [
          { lat: 12.9716, lng: 77.5946, altitude: 100 }, // Starting point
          { lat: 12.9716 + (Math.random() - 0.5) * 0.1, lng: 77.5946 + (Math.random() - 0.5) * 0.1, altitude: 120 },
          { lat: 12.9716 + (Math.random() - 0.5) * 0.1, lng: 77.5946 + (Math.random() - 0.5) * 0.1, altitude: 100 },
        ],
        color: order.status === 'in_transit' ? '#00FF00' : '#FFFF00',
        completed: order.status === 'delivered',
      };
    });

    setRoutes(mockRoutes);
  }, [activeOrders]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Customer Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">Manage your deliveries and track orders in real-time</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center gap-2 p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <User className="w-6 h-6" />
                  <ChevronDown className="w-4 h-4" />
                </button>

                {showUserDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications Panel */}
      {showNotifications && (
        <div className="absolute right-4 top-20 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            <button
              onClick={() => setNotifications(notifications.map(n => ({ ...n, read: true })))}
              className="text-sm text-purple-600 hover:text-purple-700"
            >
              Mark all read
            </button>
          </div>
          <div className="divide-y divide-gray-100">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-4 hover:bg-gray-50 transition-colors ${!notif.read ? 'bg-purple-50' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    notif.type === 'success' ? 'bg-green-500' :
                    notif.type === 'error' ? 'bg-red-500' :
                    notif.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`} />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{notif.title}</p>
                    <p className="text-gray-600 text-sm mt-1">{notif.message}</p>
                    <p className="text-gray-400 text-xs mt-1">
                      {new Date(notif.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Orders</p>
                <p className="text-3xl font-bold text-gray-900">{activeOrders.length}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Delivered</p>
                <p className="text-3xl font-bold text-gray-900">
                  {orders.filter(o => o.status === 'delivered').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Spent</p>
                <p className="text-3xl font-bold text-gray-900">
                  ₹{orders.reduce((sum, o) => sum + o.estimatedCost, 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Avg Rating</p>
                <p className="text-3xl font-bold text-gray-900">4.8</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Overview Content */}
        <div className="space-y-6">
          {/* Active Order - Live Tracking */}
          {activeOrders.length > 0 && (
            <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl p-6 text-white">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm opacity-90 mb-1">Order in Transit</p>
                  <p className="text-2xl font-bold">{activeOrders[0].id}</p>
                </div>
                <StatusBadge status={activeOrders[0].status} />
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 opacity-90" />
                  <span className="text-sm">{activeOrders[0].deliveryAddress}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Navigation className="w-5 h-5 opacity-90" />
                  <span className="text-sm">Drone: {activeOrders[0].droneId}</span>
                </div>
              </div>

              <div className="flex items-center justify-between bg-white/20 rounded-lg p-4 backdrop-blur-sm">
                <ETACountdown eta={activeOrders[0].eta} status={activeOrders[0].status} />
                <button
                  onClick={() => navigate('/customer/tracking')}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                >
                  Track Live
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Recent Orders */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h3>
            <div className="space-y-3">
              {orders.slice(0, 3).map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => navigate('/customer/orders')}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{order.id}</p>
                      <p className="text-sm text-gray-600">{order.deliveryAddress}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <StatusBadge status={order.status} />
                    <button className="text-gray-400 hover:text-gray-600">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/customer/orders')}
              className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-all"
            >
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Plus className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">New Delivery</p>
                <p className="text-sm text-gray-600">Create a new order</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/customer/orders')}
              className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">View Analytics</p>
                <p className="text-sm text-gray-600">Delivery insights</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/customer/orders')}
              className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-all"
            >
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Download className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">Download Invoices</p>
                <p className="text-sm text-gray-600">Export all invoices</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
