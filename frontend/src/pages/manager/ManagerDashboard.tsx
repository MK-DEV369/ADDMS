import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plane, Battery, MapPin, Clock, AlertTriangle, Cloud, 
  TrendingUp, Package, Users, Activity, Settings, Map,
  Calendar, Wind, Droplets, Eye, Navigation, Zap
} from 'lucide-react';

// Types
interface Drone {
  id: string;
  model: string;
  status: 'active' | 'idle' | 'maintenance' | 'emergency' | 'offline';
  battery: number;
  location: { lat: number; lon: number; alt: number };
  currentTask?: string;
  lastUpdate: string;
}

interface Delivery {
  id: string;
  orderId: string;
  customer: string;
  pickup: string;
  dropoff: string;
  droneId?: string;
  status: 'pending' | 'assigned' | 'in-transit' | 'delivered' | 'failed';
  eta?: string;
  priority: 'standard' | 'express' | 'urgent';
}

interface Zone {
  id: string;
  name: string;
  type: 'operational' | 'no-fly';
  deliveryCount?: number;
  avgCompletionTime?: number;
  status: 'active' | 'inactive';
}

interface Weather {
  zone: string;
  temp: number;
  windSpeed: number;
  windDirection: number;
  visibility: number;
  condition: string;
  precipitation: number;
  alert?: string;
}

// Mock data
const mockDrones: Drone[] = [
  { id: 'D001', model: 'Skyward X2', status: 'active', battery: 85, location: { lat: 12.9716, lon: 77.5946, alt: 120 }, currentTask: 'Delivery #1234', lastUpdate: '2 min ago' },
  { id: 'D002', model: 'Skyward X2', status: 'idle', battery: 92, location: { lat: 12.9516, lon: 77.6046, alt: 0 }, lastUpdate: '5 min ago' },
  { id: 'D003', model: 'Cargo Pro', status: 'active', battery: 45, location: { lat: 12.9916, lon: 77.5846, alt: 150 }, currentTask: 'Delivery #1235', lastUpdate: '1 min ago' },
  { id: 'D004', model: 'Skyward X2', status: 'maintenance', battery: 100, location: { lat: 12.9616, lon: 77.5946, alt: 0 }, lastUpdate: '30 min ago' },
  { id: 'D005', model: 'Cargo Pro', status: 'idle', battery: 78, location: { lat: 12.9816, lon: 77.6146, alt: 0 }, lastUpdate: '3 min ago' },
  { id: 'D006', model: 'Skyward X2', status: 'emergency', battery: 15, location: { lat: 12.9416, lon: 77.5746, alt: 80 }, currentTask: 'Delivery #1236', lastUpdate: 'Just now' },
];

const mockDeliveries: Delivery[] = [
  { id: '1', orderId: '#1234', customer: 'John Doe', pickup: 'Warehouse A', dropoff: 'HSR Layout', droneId: 'D001', status: 'in-transit', eta: '15 min', priority: 'express' },
  { id: '2', orderId: '#1235', customer: 'Jane Smith', pickup: 'Warehouse B', dropoff: 'Koramangala', droneId: 'D003', status: 'in-transit', eta: '22 min', priority: 'standard' },
  { id: '3', orderId: '#1236', customer: 'Bob Wilson', pickup: 'Warehouse A', dropoff: 'Indiranagar', droneId: 'D006', status: 'in-transit', eta: '8 min', priority: 'urgent' },
  { id: '4', orderId: '#1237', customer: 'Alice Brown', pickup: 'Warehouse C', dropoff: 'Whitefield', status: 'pending', priority: 'standard' },
  { id: '5', orderId: '#1238', customer: 'Charlie Davis', pickup: 'Warehouse B', dropoff: 'Jayanagar', status: 'pending', priority: 'express' },
];

const mockZones: Zone[] = [
  { id: 'Z001', name: 'Central Zone', type: 'operational', deliveryCount: 145, avgCompletionTime: 18, status: 'active' },
  { id: 'Z002', name: 'East Zone', type: 'operational', deliveryCount: 98, avgCompletionTime: 22, status: 'active' },
  { id: 'Z003', name: 'Airport NFZ', type: 'no-fly', status: 'active' },
  { id: 'Z004', name: 'Military Base NFZ', type: 'no-fly', status: 'active' },
];

const mockWeather: Weather[] = [
  { zone: 'Central Zone', temp: 28, windSpeed: 12, windDirection: 245, visibility: 10, condition: 'Clear', precipitation: 0 },
  { zone: 'East Zone', temp: 29, windSpeed: 18, windDirection: 270, visibility: 8, condition: 'Partly Cloudy', precipitation: 0, alert: 'High Wind' },
];

export default function ManagerDashboard() {
  const [activeTab, setActiveTab] = useState<'fleet' | 'deliveries' | 'zones' | 'weather' | 'analytics'>('fleet');
  const [selectedDrone, setSelectedDrone] = useState<string | null>(null);
  const [drones, setDrones] = useState<Drone[]>(mockDrones);
  const [deliveries, setDeliveries] = useState<Delivery[]>(mockDeliveries);
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<string | null>(null);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setDrones(prev => prev.map(drone => {
        if (drone.status === 'active' && drone.battery > 20) {
          return {
            ...drone,
            battery: Math.max(15, drone.battery - Math.random() * 2),
            location: {
              ...drone.location,
              lat: drone.location.lat + (Math.random() - 0.5) * 0.01,
              lon: drone.location.lon + (Math.random() - 0.5) * 0.01,
            }
          };
        }
        return drone;
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Fleet stats
  const fleetStats = useMemo(() => {
    const active = drones.filter(d => d.status === 'active').length;
    const idle = drones.filter(d => d.status === 'idle').length;
    const maintenance = drones.filter(d => d.status === 'maintenance').length;
    const emergency = drones.filter(d => d.status === 'emergency').length;
    const avgBattery = Math.round(drones.reduce((sum, d) => sum + d.battery, 0) / drones.length);
    
    return { active, idle, maintenance, emergency, total: drones.length, avgBattery };
  }, [drones]);

  // Delivery stats
  const deliveryStats = useMemo(() => {
    const pending = deliveries.filter(d => d.status === 'pending').length;
    const inTransit = deliveries.filter(d => d.status === 'in-transit').length;
    
    return { pending, inTransit, total: deliveries.length };
  }, [deliveries]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-500',
      idle: 'bg-blue-500',
      maintenance: 'bg-yellow-500',
      emergency: 'bg-red-500',
      offline: 'bg-gray-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      standard: 'text-blue-600 bg-blue-50',
      express: 'text-orange-600 bg-orange-50',
      urgent: 'text-red-600 bg-red-50',
    };
    return colors[priority] || 'text-gray-600 bg-gray-50';
  };

  const handleAssignDrone = (deliveryId: string, droneId: string) => {
    setIsAssigning(true);
    setTimeout(() => {
      setDeliveries(prev => prev.map(d => 
        d.id === deliveryId ? { ...d, droneId, status: 'assigned', eta: `${15 + Math.floor(Math.random() * 20)} min` } : d
      ));
      setDrones(prev => prev.map(dr => 
        dr.id === droneId ? { ...dr, status: 'active', currentTask: deliveries.find(d => d.id === deliveryId)?.orderId } : dr
      ));
      setIsAssigning(false);
      setSelectedDelivery(null);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fleet Manager</h1>
            <p className="text-sm text-gray-500 mt-1">Real-time drone operations control</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Activity className="w-4 h-4 text-green-500" />
              <span className="text-gray-600">System Online</span>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Plane className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{fleetStats.total}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">Total Drones</h3>
            <div className="flex gap-2 mt-3 text-xs">
              <span className="text-green-600">{fleetStats.active} Active</span>
              <span className="text-blue-600">{fleetStats.idle} Idle</span>
              {fleetStats.emergency > 0 && <span className="text-red-600">{fleetStats.emergency} Alert</span>}
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Package className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{deliveryStats.inTransit}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">In Transit</h3>
            <div className="mt-3 text-xs text-gray-500">
              {deliveryStats.pending} pending assignment
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Battery className="w-6 h-6 text-yellow-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{fleetStats.avgBattery}%</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">Avg Battery</h3>
            <div className="mt-3">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-400 to-green-500 transition-all duration-500"
                  style={{ width: `${fleetStats.avgBattery}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">94%</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">On-Time Rate</h3>
            <div className="flex items-center gap-1 mt-3 text-xs text-green-600">
              <TrendingUp className="w-3 h-3" />
              <span>+5% from last week</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex">
              {[
                { id: 'fleet', label: 'Fleet Monitor', icon: Plane },
                { id: 'deliveries', label: 'Deliveries', icon: Package },
                { id: 'zones', label: 'Zones', icon: Map },
                { id: 'weather', label: 'Weather', icon: Cloud },
                { id: 'analytics', label: 'Analytics', icon: TrendingUp },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {/* Fleet Monitor Tab */}
            {activeTab === 'fleet' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 3D Map Placeholder */}
                <div className="lg:col-span-2">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg h-[600px] border border-blue-200 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-500 rounded-full blur-3xl" />
                      <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-purple-500 rounded-full blur-3xl" />
                    </div>
                    <div className="text-center z-10">
                      <Map className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-700 mb-2">3D Map View</h3>
                      <p className="text-gray-500 mb-4">CesiumJS integration for live drone tracking</p>
                      <div className="bg-white rounded-lg p-4 inline-block shadow-sm">
                        <div className="flex items-center gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                            <span>{fleetStats.active} Active</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-full" />
                            <span>{fleetStats.idle} Idle</span>
                          </div>
                          {fleetStats.emergency > 0 && (
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                              <span>{fleetStats.emergency} Alert</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Drone List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Live Drone Status</h3>
                    <span className="text-xs text-gray-500">Updates every 3s</span>
                  </div>
                  <div className="space-y-3 max-h-[560px] overflow-y-auto pr-2">
                    {drones.map(drone => (
                      <div
                        key={drone.id}
                        onClick={() => setSelectedDrone(drone.id === selectedDrone ? null : drone.id)}
                        className={`p-4 rounded-lg border cursor-pointer transition-all ${
                          selectedDrone === drone.id
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${getStatusColor(drone.status)} ${
                              drone.status === 'active' || drone.status === 'emergency' ? 'animate-pulse' : ''
                            }`} />
                            <div>
                              <div className="font-semibold text-gray-900">{drone.id}</div>
                              <div className="text-xs text-gray-500">{drone.model}</div>
                            </div>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full font-medium capitalize ${
                            drone.status === 'active' ? 'bg-green-100 text-green-700' :
                            drone.status === 'idle' ? 'bg-blue-100 text-blue-700' :
                            drone.status === 'emergency' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {drone.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                          <Battery className={`w-4 h-4 ${
                            drone.battery > 50 ? 'text-green-600' :
                            drone.battery > 20 ? 'text-yellow-600' :
                            'text-red-600'
                          }`} />
                          <div className="flex-1">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-gray-600">Battery</span>
                              <span className="font-medium">{drone.battery}%</span>
                            </div>
                            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-500 ${
                                  drone.battery > 50 ? 'bg-green-500' :
                                  drone.battery > 20 ? 'bg-yellow-500' :
                                  'bg-red-500'
                                }`}
                                style={{ width: `${drone.battery}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {drone.currentTask && (
                          <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                            <Package className="w-3 h-3" />
                            <span>{drone.currentTask}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <MapPin className="w-3 h-3" />
                          <span>{drone.location.lat.toFixed(4)}, {drone.location.lon.toFixed(4)}</span>
                          <span className="ml-auto">{drone.lastUpdate}</span>
                        </div>

                        {drone.status === 'emergency' && (
                          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                            <span className="text-xs text-red-700 font-medium">Low battery - RTB initiated</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Deliveries Tab */}
            {activeTab === 'deliveries' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Active Deliveries */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">Active Deliveries</h3>
                    <div className="space-y-3">
                      {deliveries.filter(d => d.status === 'in-transit' || d.status === 'assigned').map(delivery => (
                        <div key={delivery.id} className="p-4 bg-white border border-gray-200 rounded-lg">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="font-semibold text-gray-900">{delivery.orderId}</div>
                              <div className="text-sm text-gray-600">{delivery.customer}</div>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${getPriorityColor(delivery.priority)}`}>
                              {delivery.priority}
                            </span>
                          </div>

                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-gray-600">
                              <MapPin className="w-4 h-4" />
                              <span>{delivery.pickup} → {delivery.dropoff}</span>
                            </div>
                            {delivery.droneId && (
                              <div className="flex items-center gap-2 text-gray-600">
                                <Plane className="w-4 h-4" />
                                <span>Drone {delivery.droneId}</span>
                              </div>
                            )}
                            {delivery.eta && (
                              <div className="flex items-center gap-2 text-green-600 font-medium">
                                <Clock className="w-4 h-4" />
                                <span>ETA: {delivery.eta}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pending Assignments */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">Pending Assignment</h3>
                    <div className="space-y-3">
                      {deliveries.filter(d => d.status === 'pending').map(delivery => (
                        <div key={delivery.id} className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="font-semibold text-gray-900">{delivery.orderId}</div>
                              <div className="text-sm text-gray-600">{delivery.customer}</div>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${getPriorityColor(delivery.priority)}`}>
                              {delivery.priority}
                            </span>
                          </div>

                          <div className="space-y-2 text-sm mb-3">
                            <div className="flex items-center gap-2 text-gray-600">
                              <MapPin className="w-4 h-4" />
                              <span>{delivery.pickup} → {delivery.dropoff}</span>
                            </div>
                          </div>

                          <button
                            onClick={() => setSelectedDelivery(delivery.id)}
                            className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                          >
                            Assign Drone
                          </button>

                          {selectedDelivery === delivery.id && (
                            <div className="mt-3 p-3 bg-white border border-gray-200 rounded">
                              <div className="text-xs font-medium text-gray-700 mb-2">Available Drones:</div>
                              <div className="space-y-2">
                                {drones.filter(d => d.status === 'idle' && d.battery > 50).map(drone => (
                                  <button
                                    key={drone.id}
                                    onClick={() => handleAssignDrone(delivery.id, drone.id)}
                                    disabled={isAssigning}
                                    className="w-full flex items-center justify-between p-2 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded text-sm disabled:opacity-50"
                                  >
                                    <span className="font-medium">{drone.id}</span>
                                    <span className="text-gray-600">{drone.battery}%</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Zones Tab */}
            {activeTab === 'zones' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Operational Zones</h3>
                  <div className="space-y-3">
                    {mockZones.filter(z => z.type === 'operational').map(zone => (
                      <div key={zone.id} className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="font-semibold text-gray-900">{zone.name}</div>
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                            Active
                          </span>
                        </div>
                        {zone.deliveryCount !== undefined && (
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <div className="text-gray-600">Deliveries</div>
                              <div className="text-lg font-semibold text-gray-900">{zone.deliveryCount}</div>
                            </div>
                            <div>
                              <div className="text-gray-600">Avg Time</div>
                              <div className="text-lg font-semibold text-gray-900">{zone.avgCompletionTime} min</div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">No-Fly Zones</h3>
                  <div className="space-y-3">
                    {mockZones.filter(z => z.type === 'no-fly').map(zone => (
                      <div key={zone.id} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="font-semibold text-gray-900">{zone.name}</div>
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Weather Tab */}
            {activeTab === 'weather' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {mockWeather.map(weather => (
                  <div key={weather.zone} className={`p-6 rounded-lg border ${
                    weather.alert ? 'bg-orange-50 border-orange-300' : 'bg-white border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900">{weather.zone}</h3>
                      {weather.alert && (
                        <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full font-medium flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {weather.alert}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <Cloud className="w-8 h-8 text-blue-600 mb-2" />
                        <div className="text-2xl font-bold text-gray-900">{weather.temp}°C</div>
                        <div className="text-xs text-gray-600">{weather.condition}</div>
                      </div>

                      <div className="p-4 bg-green-50 rounded-lg">
                        <Wind className="w-8 h-8 text-green-600 mb-2" />
                        <div className="text-2xl font-bold text-gray-900">{weather.windSpeed} km/h</div>
                        <div className="text-xs text-gray-600">{weather.windDirection}°</div>
                      </div>

                      <div className="p-4 bg-purple-50 rounded-lg">
                        <Eye className="w-8 h-8 text-purple-600 mb-2" />
                        <div className="text-2xl font-bold text-gray-900">{weather.visibility} km</div>
                        <div className="text-xs text-gray-600">Visibility</div>
                      </div>

                      <div className="p-4 bg-indigo-50 rounded-lg">
                        <Droplets className="w-8 h-8 text-indigo-600 mb-2" />
                        <div className="text-2xl font-bold text-gray-900">{weather.precipitation}%</div>
                        <div className="text-xs text-gray-600">Precipitation</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg text-white">
                    <div className="flex items-center justify-between mb-4">
                      <Zap className="w-8 h-8 opacity-80" />
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div className="text-3xl font-bold mb-1">89%</div>
                    <div className="text-sm opacity-90">Fleet Utilization</div>
                    <div className="text-xs mt-2 opacity-75">+12% from last month</div>
                  </div>

                  <div className="p-6 bg-gradient-to-br from-green-500 to-green-600 rounded-lg text-white">
                    <div className="flex items-center justify-between mb-4">
                      <Package className="w-8 h-8 opacity-80" />
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div className="text-3xl font-bold mb-1">342</div>
                    <div className="text-sm opacity-90">Deliveries Today</div>
                    <div className="text-xs mt-2 opacity-75">Target: 350</div>
                  </div>

                  <div className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg text-white">
                    <div className="flex items-center justify-between mb-4">
                      <Clock className="w-8 h-8 opacity-80" />
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div className="text-3xl font-bold mb-1">18.5</div>
                    <div className="text-sm opacity-90">Avg Delivery (min)</div>
                    <div className="text-xs mt-2 opacity-75">-2 min from target</div>
                  </div>
                </div>

                {/* Charts Placeholder */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Deliveries This Week</h3>
                    <div className="h-64 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
                      <div className="text-center text-gray-500">
                        <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-40" />
                        <div className="text-sm">Line Chart with Recharts</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Drone Status Distribution</h3>
                    <div className="h-64 flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
                      <div className="text-center text-gray-500">
                        <Activity className="w-12 h-12 mx-auto mb-2 opacity-40" />
                        <div className="text-sm">Pie Chart with Recharts</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Battery Usage Trends</h3>
                    <div className="h-64 flex items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg">
                      <div className="text-center text-gray-500">
                        <Battery className="w-12 h-12 mx-auto mb-2 opacity-40" />
                        <div className="text-sm">Area Chart with Recharts</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Zone Performance</h3>
                    <div className="h-64 flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                      <div className="text-center text-gray-500">
                        <Map className="w-12 h-12 mx-auto mb-2 opacity-40" />
                        <div className="text-sm">Bar Chart with Recharts</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}