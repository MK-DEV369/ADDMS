import React, { useState, useEffect } from 'react';
import { 
  Package, MapPin, Clock, DollarSign, ChevronRight, 
  Plus, Search, Filter, Bell, Calendar, TrendingUp,
  CheckCircle, XCircle, Loader, Eye, Star, Download,
  AlertCircle, Navigation, Zap
} from 'lucide-react';

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

// New Order Modal Component
const NewOrderModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    pickupAddress: '',
    deliveryAddress: '',
    packageWeight: '',
    packageDimensions: { length: '', width: '', height: '' },
    isFragile: false,
    priority: 'standard',
    scheduledTime: '',
  });

  if (!isOpen) return null;

  const handleSubmit = () => {
    // TODO: API call to create order
    console.log('Creating order:', formData);
    onClose();
    setStep(1);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Create New Delivery</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((s) => (
              <React.Fragment key={s}>
                <div className={`flex items-center gap-2 ${step >= s ? 'text-purple-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                    step >= s ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {s}
                  </div>
                  <span className="text-sm font-medium hidden sm:inline">
                    {s === 1 && 'Package'}
                    {s === 2 && 'Locations'}
                    {s === 3 && 'Schedule'}
                    {s === 4 && 'Confirm'}
                  </span>
                </div>
                {s < 4 && <div className={`flex-1 h-1 mx-2 ${step > s ? 'bg-purple-600' : 'bg-gray-200'}`} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="px-6 py-6">
          {/* Step 1: Package Details */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Package Details</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Weight (kg) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.packageWeight}
                  onChange={(e) => setFormData({ ...formData, packageWeight: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="2.5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dimensions (cm)
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="number"
                    value={formData.packageDimensions.length}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      packageDimensions: { ...formData.packageDimensions, length: e.target.value }
                    })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="Length"
                  />
                  <input
                    type="number"
                    value={formData.packageDimensions.width}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      packageDimensions: { ...formData.packageDimensions, width: e.target.value }
                    })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="Width"
                  />
                  <input
                    type="number"
                    value={formData.packageDimensions.height}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      packageDimensions: { ...formData.packageDimensions, height: e.target.value }
                    })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="Height"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="fragile"
                  checked={formData.isFragile}
                  onChange={(e) => setFormData({ ...formData, isFragile: e.target.checked })}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <label htmlFor="fragile" className="text-sm text-gray-700">
                  Fragile - Handle with care
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="standard">Standard (30-45 min)</option>
                  <option value="express">Express (15-20 min) - +₹100</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 2: Locations */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Pickup & Delivery Locations</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pickup Address *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.pickupAddress}
                    onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter pickup address"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Address *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.deliveryAddress}
                    onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter delivery address"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Address Verification</p>
                    <p>Both addresses must be within operational zones. We'll verify this after you proceed.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Schedule */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Scheduling</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setFormData({ ...formData, scheduledTime: '' })}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    !formData.scheduledTime 
                      ? 'border-purple-600 bg-purple-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Zap className={`w-6 h-6 mb-2 ${!formData.scheduledTime ? 'text-purple-600' : 'text-gray-400'}`} />
                  <div className="font-semibold text-gray-900">Immediate</div>
                  <div className="text-sm text-gray-600">Deliver ASAP</div>
                </button>

                <button
                  onClick={() => setFormData({ ...formData, scheduledTime: new Date().toISOString() })}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    formData.scheduledTime 
                      ? 'border-purple-600 bg-purple-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Calendar className={`w-6 h-6 mb-2 ${formData.scheduledTime ? 'text-purple-600' : 'text-gray-400'}`} />
                  <div className="font-semibold text-gray-900">Scheduled</div>
                  <div className="text-sm text-gray-600">Pick a time</div>
                </button>
              </div>

              {formData.scheduledTime && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Scheduled Time
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.scheduledTime.slice(0, 16)}
                    onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 4: Review & Confirm */}
          {step === 4 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Review & Confirm</h3>
              
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Package Weight</span>
                  <span className="font-medium">{formData.packageWeight} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Priority</span>
                  <span className="font-medium capitalize">{formData.priority}</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between items-start">
                    <span className="text-gray-600">Pickup</span>
                    <span className="font-medium text-right max-w-xs">{formData.pickupAddress || 'Not set'}</span>
                  </div>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-gray-600">Delivery</span>
                  <span className="font-medium text-right max-w-xs">{formData.deliveryAddress || 'Not set'}</span>
                </div>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700 font-medium">Estimated Cost</span>
                  <span className="text-2xl font-bold text-purple-600">₹250</span>
                </div>
                <div className="text-sm text-gray-600">
                  Estimated delivery time: 20-30 minutes
                </div>
              </div>

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="terms"
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 mt-1"
                />
                <label htmlFor="terms" className="text-sm text-gray-600">
                  I agree to the terms and conditions and authorize the delivery
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-between">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Back
            </button>
          )}
          <div className="ml-auto flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            {step < 4 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Confirm Order
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Dashboard Component
export default function CustomerDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'tracking'>('overview');
  const [orders] = useState<Order[]>(mockOrders);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const unreadCount = notifications.filter(n => !n.read).length;
  const activeOrders = orders.filter(o => ['pending', 'assigned', 'in_transit'].includes(o.status));

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          order.pickupAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          order.deliveryAddress.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || order.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

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
              <button
                onClick={() => setShowNewOrderModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-lg shadow-purple-600/30"
              >
                <Plus className="w-5 h-5" />
                New Order
              </button>
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

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="border-b border-gray-200 px-6">
            <div className="flex gap-8">
              {(['overview', 'orders', 'tracking'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab
                      ? 'border-purple-600 text-purple-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
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
                        onClick={() => setActiveTab('tracking')}
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
            )}

            {activeTab === 'orders' && (
              <div className="space-y-4">
                {/* Search and Filter */}
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search orders..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="assigned">Assigned</option>
                    <option value="in_transit">In Transit</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Orders Table */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Delivery Address</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-medium text-gray-900">{order.id}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-600">{order.deliveryAddress}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={order.status} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-medium text-gray-900">₹{order.estimatedCost}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <button
                                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {order.status === 'delivered' && (
                                <button
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Download Invoice"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredOrders.length === 0 && (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No orders found</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'tracking' && (
              <div className="space-y-6">
                {/* 3D Map Placeholder */}
                <div className="bg-gray-900 rounded-xl overflow-hidden" style={{ height: '500px' }}>
                  <div className="w-full h-full flex items-center justify-center text-white">
                    <div className="text-center">
                      <Navigation className="w-16 h-16 mx-auto mb-4 opacity-50 animate-pulse" />
                      <h3 className="text-xl font-semibold mb-2">Live Tracking</h3>
                      <p className="text-gray-400">3D CesiumJS Map Integration</p>
                      <p className="text-sm text-gray-500 mt-2">TODO: Implement Map3D.tsx component</p>
                    </div>
                  </div>
                </div>

                {/* Tracking Details */}
                {activeOrders.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h4 className="font-semibold text-gray-900 mb-4">Delivery Details</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Order ID</span>
                          <span className="font-medium">{activeOrders[0].id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Drone ID</span>
                          <span className="font-medium">{activeOrders[0].droneId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Package Weight</span>
                          <span className="font-medium">{activeOrders[0].packageWeight} kg</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status</span>
                          <StatusBadge status={activeOrders[0].status} />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h4 className="font-semibold text-gray-900 mb-4">Status Timeline</h4>
                      <div className="space-y-4">
                        <div className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                              <CheckCircle className="w-5 h-5 text-white" />
                            </div>
                            <div className="w-0.5 h-12 bg-green-500" />
                          </div>
                          <div className="flex-1 pt-1">
                            <p className="font-medium text-gray-900">Order Confirmed</p>
                            <p className="text-sm text-gray-500">{new Date(activeOrders[0].createdAt).toLocaleString()}</p>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                              <CheckCircle className="w-5 h-5 text-white" />
                            </div>
                            <div className="w-0.5 h-12 bg-purple-500" />
                          </div>
                          <div className="flex-1 pt-1">
                            <p className="font-medium text-gray-900">Drone Assigned</p>
                            <p className="text-sm text-gray-500">Drone {activeOrders[0].droneId} en route</p>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center animate-pulse">
                              <Loader className="w-5 h-5 text-white animate-spin" />
                            </div>
                          </div>
                          <div className="flex-1 pt-1">
                            <p className="font-medium text-gray-900">In Transit</p>
                            <ETACountdown eta={activeOrders[0].eta} status={activeOrders[0].status} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeOrders.length === 0 && (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">No active deliveries</p>
                    <button
                      onClick={() => setShowNewOrderModal(true)}
                      className="text-purple-600 hover:text-purple-700 font-medium"
                    >
                      Create a new order to start tracking
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setShowNewOrderModal(true)}
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

            <button className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">View Analytics</p>
                <p className="text-sm text-gray-600">Delivery insights</p>
              </div>
            </button>

            <button className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-all">
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

      {/* New Order Modal */}
      <NewOrderModal isOpen={showNewOrderModal} onClose={() => setShowNewOrderModal(false)} />
    </div>
  );
}