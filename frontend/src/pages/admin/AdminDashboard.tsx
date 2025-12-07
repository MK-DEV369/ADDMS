import React, { useState, useMemo } from 'react';
import {
  Users,
  MapPin,
  BarChart3,
  FileText,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Download,
  TrendingUp,
  TrendingDown,
  Battery,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Eye,
  Settings,
  Calendar,
  Activity
} from 'lucide-react';
import { Plane } from 'lucide-react';

// Type definitions
interface Drone {
  id: string;
  model: string;
  status: 'active' | 'idle' | 'maintenance' | 'inactive' | 'error';
  battery: number;
  location: string;
  lastUpdate: string;
  flights: number;
  maxPayload: number;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  lastLogin: string;
}

interface Zone {
  id: number;
  name: string;
  type: string;
  area: number;
  status: 'active' | 'maintenance' | 'error';
  deliveries?: number;
  violations?: number;
}

interface Log {
  id: number;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  service: string;
  message: string;
  correlationId: string;
}

// Mock data for demonstration
const mockDrones: Drone[] = [
  { id: 'DRN-001', model: 'Phantom X', status: 'active', battery: 87, location: 'Zone A', lastUpdate: '2 min ago', flights: 145, maxPayload: 5 },
  { id: 'DRN-002', model: 'SkyHawk Pro', status: 'maintenance', battery: 23, location: 'Hangar', lastUpdate: '1 hour ago', flights: 289, maxPayload: 8 },
  { id: 'DRN-003', model: 'Phantom X', status: 'active', battery: 92, location: 'Zone B', lastUpdate: '1 min ago', flights: 67, maxPayload: 5 },
  { id: 'DRN-004', model: 'CargoMax', status: 'idle', battery: 100, location: 'Zone C', lastUpdate: '5 min ago', flights: 234, maxPayload: 15 },
  { id: 'DRN-005', model: 'SkyHawk Pro', status: 'active', battery: 76, location: 'Zone A', lastUpdate: '3 min ago', flights: 178, maxPayload: 8 },
];

const mockUsers: User[] = [
  { id: 1, name: 'John Smith', email: 'john@example.com', role: 'admin', status: 'active', lastLogin: '2024-12-06 09:30' },
  { id: 2, name: 'Sarah Johnson', email: 'sarah@example.com', role: 'manager', status: 'active', lastLogin: '2024-12-06 10:15' },
  { id: 3, name: 'Mike Chen', email: 'mike@example.com', role: 'customer', status: 'active', lastLogin: '2024-12-05 16:45' },
  { id: 4, name: 'Emily Davis', email: 'emily@example.com', role: 'manager', status: 'inactive', lastLogin: '2024-12-01 11:20' },
  { id: 5, name: 'Robert Wilson', email: 'robert@example.com', role: 'customer', status: 'active', lastLogin: '2024-12-06 08:00' },
];

const mockZones: Zone[] = [
  { id: 1, name: 'Downtown Area', type: 'operational', area: 12.5, status: 'active', deliveries: 1247 },
  { id: 2, name: 'Airport Vicinity', type: 'no-fly', area: 8.3, status: 'active', violations: 3 },
  { id: 3, name: 'Residential North', type: 'operational', area: 15.7, status: 'active', deliveries: 892 },
  { id: 4, name: 'Military Base', type: 'no-fly', area: 5.2, status: 'active', violations: 0 },
  { id: 5, name: 'Industrial Park', type: 'operational', area: 9.8, status: 'maintenance', deliveries: 0 },
];

const mockLogs: Log[] = [
  { id: 1, timestamp: '2024-12-06 10:45:23', level: 'info', service: 'backend', message: 'Delivery DLV-1234 assigned to drone DRN-001', correlationId: 'abc123' },
  { id: 2, timestamp: '2024-12-06 10:44:15', level: 'warn', service: 'celery', message: 'Route optimization took longer than expected (3.2s)', correlationId: 'def456' },
  { id: 3, timestamp: '2024-12-06 10:43:02', level: 'error', service: 'channels', message: 'WebSocket connection lost for user user@example.com', correlationId: 'ghi789' },
  { id: 4, timestamp: '2024-12-06 10:42:18', level: 'info', service: 'backend', message: 'Weather data updated for Zone A', correlationId: 'jkl012' },
  { id: 5, timestamp: '2024-12-06 10:41:05', level: 'info', service: 'backend', message: 'Drone DRN-003 maintenance completed', correlationId: 'mno345' },
];

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('drones');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedItem, setSelectedItem] = useState<Drone | User | Zone | null>(null);

  // KPI calculations
  const kpis = useMemo(() => ({
    totalDrones: mockDrones.length,
    activeDrones: mockDrones.filter(d => d.status === 'active').length,
    avgBattery: Math.round(mockDrones.reduce((acc, d) => acc + d.battery, 0) / mockDrones.length),
    totalUsers: mockUsers.length,
    activeDeliveries: 23,
    completedToday: 156,
    avgDeliveryTime: 18.5,
    onTimeRate: 94.2
  }), []);

  const tabs = [
    { id: 'drones', label: 'Drones', icon: Plane },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'zones', label: 'Zones', icon: MapPin },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'logs', label: 'System Logs', icon: FileText },
  ];

  const getStatusColor = (status: 'active' | 'idle' | 'maintenance' | 'inactive' | 'error') => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      idle: 'bg-blue-100 text-blue-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
      inactive: 'bg-gray-100 text-gray-800',
      error: 'bg-red-100 text-red-800',
    };
    return colors[status] || colors.idle;
  };

  const getBatteryColor = (level: number) => {
    if (level > 60) return 'text-green-600';
    if (level > 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getLogLevelColor = (level: 'info'| 'warn'| 'error') => {
    const colors = {
      info: 'bg-blue-100 text-blue-800',
      warn: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
    };
    return colors[level] || colors.info;
  };

  const openModal = (type: string, item: Drone | User | Zone | null = null) => {
    setModalType(type);
    setSelectedItem(item);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedItem(null);
  };

  // Filter functions
  const filteredDrones = mockDrones.filter(drone => {
    const matchesSearch = drone.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         drone.model.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || drone.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredUsers = mockUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || user.role === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredZones = mockZones.filter(zone => {
    const matchesSearch = zone.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || zone.type === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredLogs = mockLogs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.correlationId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = selectedStatus === 'all' || log.level === selectedStatus;
    return matchesSearch && matchesLevel;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">Manage your drone fleet, users, and system configuration</p>
        </div>
        
        {/* Tabs */}
        <div className="px-6">
          <div className="flex space-x-8 border-b border-gray-200">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSearchTerm('');
                    setSelectedStatus('all');
                  }}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        {/* Drones Tab */}
        {activeTab === 'drones' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Drones</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{kpis.totalDrones}</p>
                  </div>
                  <Plane className="w-10 h-10 text-blue-500" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Now</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">{kpis.activeDrones}</p>
                  </div>
                  <Activity className="w-10 h-10 text-green-500" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Battery</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{kpis.avgBattery}%</p>
                  </div>
                  <Battery className={`w-10 h-10 ${getBatteryColor(kpis.avgBattery)}`} />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Maintenance</p>
                    <p className="text-3xl font-bold text-yellow-600 mt-2">
                      {mockDrones.filter(d => d.status === 'maintenance').length}
                    </p>
                  </div>
                  <Settings className="w-10 h-10 text-yellow-500" />
                </div>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by ID or model..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="idle">Idle</option>
                  <option value="maintenance">Maintenance</option>
                </select>
                
                <button
                  onClick={() => openModal('addDrone')}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Drone</span>
                </button>
              </div>
            </div>

            {/* Drones Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Battery</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Flights</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Update</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDrones.map(drone => (
                    <tr key={drone.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{drone.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{drone.model}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(drone.status)}`}>
                          {drone.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center space-x-2">
                          <Battery className={`w-4 h-4 ${getBatteryColor(drone.battery)}`} />
                          <span className={`font-medium ${getBatteryColor(drone.battery)}`}>{drone.battery}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{drone.location}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{drone.flights}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{drone.lastUpdate}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button onClick={() => openModal('viewDrone', drone)} className="text-blue-600 hover:text-blue-800">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => openModal('editDrone', drone)} className="text-green-600 hover:text-green-800">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => openModal('deleteDrone', drone)} className="text-red-600 hover:text-red-800">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="customer">Customer</option>
                </select>
                
                <button
                  onClick={() => openModal('addUser')}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add User</span>
                </button>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                          user.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(user.status)}`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.lastLogin}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button onClick={() => openModal('editUser', user)} className="text-green-600 hover:text-green-800">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => openModal('deleteUser', user)} className="text-red-600 hover:text-red-800">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Zones Tab */}
        {activeTab === 'zones' && (
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search zones..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="operational">Operational</option>
                  <option value="no-fly">No-Fly</option>
                </select>
                
                <button
                  onClick={() => openModal('addZone')}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Zone</span>
                </button>
              </div>
            </div>

            {/* Zones Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredZones.map(zone => (
                <div key={zone.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                  <div className={`h-2 rounded-t-lg ${zone.type === 'operational' ? 'bg-green-500' : 'bg-red-500'}`} />
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{zone.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{zone.area} km²</p>
                      </div>
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        zone.type === 'operational' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {zone.type}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Status:</span>
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(zone.status)}`}>
                          {zone.status}
                        </span>
                      </div>
                      {zone.type === 'operational' && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Deliveries:</span>
                          <span className="font-semibold text-gray-900">{zone.deliveries}</span>
                        </div>
                      )}
                      {zone.type === 'no-fly' && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Violations:</span>
                          <span className="font-semibold text-red-600">{zone.violations}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex space-x-2 pt-4 border-t border-gray-200">
                      <button onClick={() => openModal('editZone', zone)} className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                        <Edit2 className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                      <button onClick={() => openModal('deleteZone', zone)} className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors">
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-gray-600">Active Deliveries</p>
                  <Activity className="w-8 h-8 text-blue-500" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{kpis.activeDeliveries}</p>
                <div className="flex items-center mt-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-green-600">12%</span>
                  <span className="text-gray-500 ml-2">vs yesterday</span>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-gray-600">Completed Today</p>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{kpis.completedToday}</p>
                <div className="flex items-center mt-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-green-600">8%</span>
                  <span className="text-gray-500 ml-2">vs yesterday</span>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-gray-600">Avg Delivery Time</p>
                  <Clock className="w-8 h-8 text-purple-500" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{kpis.avgDeliveryTime} min</p>
                <div className="flex items-center mt-2 text-sm">
                  <TrendingDown className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-green-600">2 min</span>
                  <span className="text-gray-500 ml-2">faster</span>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-gray-600">On-Time Rate</p>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{kpis.onTimeRate}%</p>
                <div className="flex items-center mt-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-green-600">1.2%</span>
                  <span className="text-gray-500 ml-2">improvement</span>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Deliveries Chart */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Deliveries Overview</h3>
                <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded">
                  <p className="text-gray-500">Line Chart: Deliveries over last 30 days</p>
                </div>
              </div>
              
              {/* Drone Status Chart */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Fleet Status Distribution</h3>
                <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded">
                  <p className="text-gray-500">Pie Chart: Drone status breakdown</p>
                </div>
              </div>
              
              {/* Zone Performance */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Deliveries by Zone</h3>
                <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded">
                  <p className="text-gray-500">Bar Chart: Deliveries per operational zone</p>
                </div>
              </div>
              
              {/* Battery Trends */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Battery Usage Trends</h3>
                <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded">
                  <p className="text-gray-500">Area Chart: Average battery levels over time</p>
                </div>
              </div>
            </div>

            {/* Fleet Efficiency Metrics */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Fleet Efficiency Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="border-l-4 border-blue-500 pl-4">
                  <p className="text-sm font-medium text-gray-600">Utilization Rate</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">78.5%</p>
                  <p className="text-sm text-gray-500 mt-1">Average fleet utilization</p>
                </div>
                <div className="border-l-4 border-green-500 pl-4">
                  <p className="text-sm font-medium text-gray-600">Avg Downtime</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">2.3 hrs</p>
                  <p className="text-sm text-gray-500 mt-1">Per drone per day</p>
                </div>
                <div className="border-l-4 border-purple-500 pl-4">
                  <p className="text-sm font-medium text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">96.7%</p>
                  <p className="text-sm text-gray-500 mt-1">Successful deliveries</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* System Logs Tab */}
        {activeTab === 'logs' && (
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search logs by message or correlation ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Levels</option>
                  <option value="info">Info</option>
                  <option value="warn">Warning</option>
                  <option value="error">Error</option>
                </select>
                
                <button className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
                  <Download className="w-5 h-5" />
                  <span>Export</span>
                </button>
                
                <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  <RefreshCw className="w-5 h-5" />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Correlation ID</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">{log.timestamp}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getLogLevelColor(log.level)}`}>
                          {log.level.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.service}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{log.message}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{log.correlationId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {modalType === 'addDrone' && 'Add New Drone'}
                {modalType === 'editDrone' && 'Edit Drone'}
                {modalType === 'deleteDrone' && 'Delete Drone'}
                {modalType === 'viewDrone' && 'Drone Details'}
                {modalType === 'addUser' && 'Add New User'}
                {modalType === 'editUser' && 'Edit User'}
                {modalType === 'deleteUser' && 'Delete User'}
                {modalType === 'addZone' && 'Add New Zone'}
                {modalType === 'editZone' && 'Edit Zone'}
                {modalType === 'deleteZone' && 'Delete Zone'}
              </h3>
              
              {modalType === 'viewDrone' && selectedItem && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Drone ID</p>
                      <p className="font-semibold text-gray-900">{(selectedItem as Drone).id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Model</p>
                      <p className="font-semibold text-gray-900">{(selectedItem as Drone).model}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor((selectedItem as Drone).status)}`}>
                        {(selectedItem as Drone).status}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Battery</p>
                      <p className={`font-semibold ${getBatteryColor((selectedItem as Drone).battery)}`}>{(selectedItem as Drone).battery}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Location</p>
                      <p className="font-semibold text-gray-900">{(selectedItem as Drone).location}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Flights</p>
                      <p className="font-semibold text-gray-900">{(selectedItem as Drone).flights}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Max Payload</p>
                      <p className="font-semibold text-gray-900">{(selectedItem as Drone).maxPayload} kg</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Last Update</p>
                      <p className="font-semibold text-gray-900">{(selectedItem as Drone).lastUpdate}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {(modalType.includes('delete')) && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                    <p className="text-sm text-red-800">
                      Are you sure you want to delete this {modalType.includes('Drone') ? 'drone' : modalType.includes('User') ? 'user' : 'zone'}? This action cannot be undone.
                    </p>
                  </div>
                </div>
              )}
              
              {(modalType.includes('add') || modalType.includes('edit')) && !modalType.includes('delete') && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">Form fields would go here. This is a demonstration modal.</p>
                </div>
              )}
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {modalType.includes('view') ? 'Close' : 'Cancel'}
                </button>
                {!modalType.includes('view') && (
                  <button
                    onClick={closeModal}
                    className={`flex-1 px-4 py-2 rounded-lg text-white transition-colors ${
                      modalType.includes('delete') 
                        ? 'bg-red-600 hover:bg-red-700' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {modalType.includes('delete') ? 'Delete' : 'Save'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
