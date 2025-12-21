import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import {
    Package, MapPin, Clock, DollarSign, Bell, CheckCircle,
    XCircle, Loader, LogOut, User, ChevronDown, Navigation
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
            <div className="font-semibold">ETA: {timeLeft}</div>
        </div>
    );
};

// Main Tracking Component
export default function Tracking() {
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
    const [followDrone, setFollowDrone] = useState<number | null>(null);

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

    // Simulate real-time drone movement
    useEffect(() => {
        if (drones.length === 0) return;

        const interval = setInterval(() => {
            setDrones(prevDrones =>
                prevDrones.map(drone => {
                    if (drone.status === 'delivering') {
                        // Simulate movement
                        const speed = 0.001; // degrees per second
                        const newHeading = (drone.heading || 0) + (Math.random() - 0.5) * 10;
                        const deltaLat = Math.sin(newHeading * Math.PI / 180) * speed;
                        const deltaLng = Math.cos(newHeading * Math.PI / 180) * speed;

                        return {
                            ...drone,
                            position: {
                                ...drone.position,
                                lat: drone.position.lat + deltaLat,
                                lng: drone.position.lng + deltaLng,
                                altitude: drone.position.altitude + (Math.random() - 0.5) * 2,
                            },
                            heading: newHeading,
                            battery_level: Math.max(10, (drone.battery_level || 100) - 0.01), // Slowly drain battery
                        };
                    }
                    return drone;
                })
            );
        }, 2000); // Update every 2 seconds

        return () => clearInterval(interval);
    }, [drones.length]);

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Live Tracking</h1>
                            <p className="text-sm text-gray-600 mt-1">Track your deliveries in real-time</p>
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
                                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${notif.type === 'success' ? 'bg-green-500' :
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
                {/* 3D Map */}
                <div className="bg-gray-900 rounded-xl overflow-hidden mb-6" style={{ height: '600px' }}>
                    <Map3D
                        drones={drones}
                        routes={routes}
                        zones={zones}
                        followDrone={followDrone}
                        onDroneClick={(droneId) => setFollowDrone(droneId === followDrone ? null : droneId)}
                        onZoneClick={(zoneId) => console.log('Zone clicked:', zoneId)}
                        showLabels={true}
                        showZones={true}
                    />
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
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${activeOrders[0].status === 'in_transit' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                                            activeOrders[0].status === 'assigned' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                                'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                        }`}>
                                        {activeOrders[0].status === 'in_transit' && <Navigation className="w-3 h-3" />}
                                        {activeOrders[0].status === 'assigned' && <CheckCircle className="w-3 h-3" />}
                                        {activeOrders[0].status === 'pending' && <Clock className="w-3 h-3" />}
                                        {activeOrders[0].status.replace('_', ' ').toUpperCase()}
                                    </span>
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
                            onClick={() => navigate('/customer/orders')}
                            className="text-purple-600 hover:text-purple-700 font-medium"
                        >
                            Create a new order to start tracking
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
