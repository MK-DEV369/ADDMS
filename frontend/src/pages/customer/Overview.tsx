import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package, MapPin, Clock, ChevronRight,
  Plus, CheckCircle, Navigation, Zap,
  XCircle, Star, TrendingUp, Download, DollarSign
} from 'lucide-react';
import { Order } from '@/lib/types';
import { getOrders } from '@/lib/api';

// Status Badge Component
const StatusBadge: React.FC<{ status: Order['status'] }> = ({ status }) => {
  const styles = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    assigned: 'bg-blue-100 text-blue-800 border-blue-200',
    in_transit: 'bg-purple-100 text-purple-800 border-purple-200',
    delivering: 'bg-amber-100 text-amber-800 border-amber-200',
    delivered: 'bg-green-100 text-green-800 border-green-200',
    failed: 'bg-red-100 text-red-800 border-red-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
  };

  const icons = {
    pending: Clock,
    assigned: CheckCircle,
    in_transit: Navigation,
    delivering: Navigation,
    delivered: CheckCircle,
    failed: XCircle,
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
const ETACountdown: React.FC<{ eta: string | null | undefined; status: Order['status'] }> = ({ eta, status }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!eta || status !== 'in_transit') return;

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

  if (!eta || status !== 'in_transit') return null;

  return (
    <div className="flex items-center gap-2 text-purple-700">
      <Zap className="w-4 h-4 animate-pulse" />
      <span className="font-semibold">ETA: {timeLeft}</span>
    </div>
  );
};

export default function Overview() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeOrders = useMemo(
    () => (Array.isArray(orders) ? orders.filter(o => ['pending', 'assigned', 'in_transit', 'delivering'].includes(o.status)) : []),
    [orders]
  );

  useEffect(() => {
    let cancelled = false
    const loadOrders = async () => {
      setLoading(true)
      try {
        const res = await getOrders()
        if (!cancelled) {
          setOrders(Array.isArray(res.data) ? res.data : [])
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load orders', err)
          setError('Unable to load delivery data right now.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadOrders()
    const interval = setInterval(loadOrders, 15000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  if (loading && !orders.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="flex items-center gap-3 text-gray-700">
          <div className="w-5 h-5 border-2 border-purple-300 border-t-transparent rounded-full animate-spin" />
          <span>Loading your deliveries...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}
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
                  {Array.isArray(orders) ? orders.filter(o => o.status === 'delivered').length : 0}
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
                <p className="text-sm text-gray-600 mb-1">In Transit</p>
                <p className="text-3xl font-bold text-gray-900">
                  {Array.isArray(orders) ? orders.filter(o => ['in_transit', 'delivering'].includes(o.status)).length : 0}
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
                <p className="text-sm text-gray-600 mb-1">Assigned Drones</p>
                <p className="text-3xl font-bold text-gray-900">
                  {Array.isArray(orders) ? orders.filter(o => !!o.drone).length : 0}
                </p>
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
                  <span className="text-sm">{activeOrders[0].delivery_address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Navigation className="w-5 h-5 opacity-90" />
                  <span className="text-sm">Drone: {activeOrders[0].drone_serial_number || 'Unassigned'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between bg-white/20 rounded-lg p-4 backdrop-blur-sm">
                <ETACountdown eta={activeOrders[0].estimated_eta} status={activeOrders[0].status} />
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
              {(Array.isArray(orders) ? orders.slice(0, 3) : []).map((order) => (
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
                      <p className="text-sm text-gray-600">{order.delivery_address}</p>
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
