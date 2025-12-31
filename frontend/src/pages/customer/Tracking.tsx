import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import {
    Package, Clock, CheckCircle,
    Loader, Navigation
} from 'lucide-react';
import Map3D from '../../components/Map3D';
import { Drone, Order } from '@/lib/types';
import { getDrones, getOrders, getRoutes } from '@/lib/api';
import {
    ACTIVE_ORDER_STATUSES,
    MapRoute,
    buildFallbackRoute,
    mapDronesFromApi,
    mapRoutesFromApi,
    MapZone,
} from '@/lib/trackingUtils';

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
            <div className="font-semibold">ETA: {timeLeft}</div>
        </div>
    );
};

// Main Tracking Component
export default function Tracking() {
    const navigate = useNavigate();
    const user = useAuthStore(state => state.user);
    const [orders, setOrders] = useState<Order[]>([]);

    const [drones, setDrones] = useState<Drone[]>([]);
    const [routes, setRoutes] = useState<MapRoute[]>([]);
    const [zones] = useState<MapZone[]>([]);
    const [followDrone, setFollowDrone] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const activeOrders = useMemo(
        () => orders.filter(o => ACTIVE_ORDER_STATUSES.includes(o.status)),
        [orders]
    );

    const trackedOrder = activeOrders[0] || null;

    const homePosition = useMemo(() => {
        if (trackedOrder?.delivery_lat && trackedOrder.delivery_lng) {
            return {
                lat: Number(trackedOrder.delivery_lat),
                lng: Number(trackedOrder.delivery_lng),
                altitude: 1500,
            }
        }
        return { lat: 12.9716, lng: 77.5946, altitude: 5000 }
    }, [trackedOrder])

    useEffect(() => {
        let cancelled = false

        const normalizeArray = (payload: any) => Array.isArray(payload?.results)
            ? payload.results
            : Array.isArray(payload)
            ? payload
            : []

        const loadLiveData = async () => {
            setLoading(true)
            try {
                const [ordersRes, dronesRes] = await Promise.all([getOrders(), getDrones()])
                if (cancelled) return

                const ordersData: Order[] = normalizeArray(ordersRes.data)
                const dronesData = mapDronesFromApi(normalizeArray(dronesRes.data))

                const statusLookup = ordersData.reduce<Record<number, Order['status']>>((acc, order) => {
                    acc[order.id] = order.status
                    return acc
                }, {})

                const activeOrdersList = ordersData.filter(o => ACTIVE_ORDER_STATUSES.includes(o.status))
                const primaryOrder = activeOrdersList[0]

                let mappedRoutes: MapRoute[] = []
                let fallbackRoutes: MapRoute[] = []

                if (primaryOrder) {
                    const routeResponse = await getRoutes({ delivery_order: primaryOrder.id })
                        .then(res => normalizeArray(res.data))
                        .catch(() => [])

                    mappedRoutes = mapRoutesFromApi(routeResponse, statusLookup).filter(r => r.id === primaryOrder.id)

                    if (!mappedRoutes.length) {
                        const fallback = buildFallbackRoute(primaryOrder, dronesData)
                        if (fallback) fallbackRoutes = [fallback]
                    }
                }

                const visibleDrones = primaryOrder?.drone
                    ? dronesData.filter(d => d.id === primaryOrder.drone)
                    : []

                if (!cancelled) {
                    setOrders(ordersData)
                    setDrones(visibleDrones)
                    setRoutes([...mappedRoutes, ...fallbackRoutes])
                    setError(null)
                    setFollowDrone(prev => visibleDrones.some(d => d.id === prev) ? prev : visibleDrones[0]?.id ?? null)
                }
            } catch (err) {
                if (!cancelled) {
                    console.error('Failed to load live delivery data', err)
                    setError('Unable to load live delivery data right now.')
                }
            } finally {
                if (!cancelled) {
                    setLoading(false)
                }
            }
        }

        loadLiveData()
        const interval = setInterval(loadLiveData, 5000)
        return () => {
            cancelled = true
            clearInterval(interval)
        }
    }, [user?.role])

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

                {error && (
                    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                        {error}
                    </div>
                )}

                {/* 3D Map */}
                <div className="bg-gray-900 rounded-xl overflow-hidden mb-6" style={{ height: '600px' }}>
                    <Map3D
                        drones={drones}
                        routes={routes}
                        zones={zones}
                        homePosition={homePosition}
                        followDrone={followDrone}
                        onDroneClick={(droneId) => setFollowDrone(droneId === followDrone ? null : droneId)}
                        onZoneClick={(zoneId) => console.log('Zone clicked:', zoneId)}
                        onCollisionDetected={(collision) => {
                            console.error('🚨 Collision in customer tracking:', collision)
                            // Could notify customer of delivery delay due to incident
                        }}
                        showLabels={true}
                        showZones={false}
                    />
                </div>

                {/* Tracking Details */}
                {loading && (
                    <div className="flex items-center justify-center py-10 text-gray-500">
                        <Loader className="w-6 h-6 animate-spin mr-3" />
                        Loading live delivery data...
                    </div>
                )}

                {!loading && trackedOrder && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                            <h4 className="font-semibold text-gray-900 mb-4">Delivery Details</h4>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Order ID</span>
                                    <span className="font-medium">{trackedOrder.id}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Destination</span>
                                    <span className="font-medium text-right max-w-[240px]">{trackedOrder.delivery_address}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Drone</span>
                                    <span className="font-medium">{trackedOrder.drone_serial_number || 'Unassigned'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Package Weight</span>
                                    <span className="font-medium">{trackedOrder.package?.weight ?? '—'} kg</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Status</span>
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${trackedOrder.status === 'in_transit' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                                            trackedOrder.status === 'assigned' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                                trackedOrder.status === 'delivering' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                                                    'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                        }`}>
                                        {['in_transit', 'delivering'].includes(trackedOrder.status) && <Navigation className="w-3 h-3" />}
                                        {trackedOrder.status === 'assigned' && <CheckCircle className="w-3 h-3" />}
                                        {trackedOrder.status === 'pending' && <Clock className="w-3 h-3" />}
                                        {trackedOrder.status.replace('_', ' ').toUpperCase()}
                                    </span>
                                </div>
                                    {trackedOrder.estimated_eta && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Estimated Arrival</span>
                                            <span className="font-medium">{new Date(trackedOrder.estimated_eta).toLocaleString()}</span>
                                        </div>
                                    )}
                                    {trackedOrder.total_cost != null && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Estimated Cost</span>
                                            <span className="font-semibold text-purple-700">₹{trackedOrder.total_cost.toFixed(2)}</span>
                                        </div>
                                    )}
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
                                        <p className="text-sm text-gray-500">{new Date(trackedOrder.requested_at).toLocaleString()}</p>
                                    </div>
                                </div>

                                {trackedOrder.assigned_at && (
                                    <div className="flex gap-3">
                                        <div className="flex flex-col items-center">
                                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                                <CheckCircle className="w-5 h-5 text-white" />
                                            </div>
                                            <div className="w-0.5 h-12 bg-purple-500" />
                                        </div>
                                        <div className="flex-1 pt-1">
                                            <p className="font-medium text-gray-900">Drone Assigned</p>
                                            <p className="text-sm text-gray-500">Drone {trackedOrder.drone_serial_number || trackedOrder.drone} assigned</p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-3">
                                    <div className="flex flex-col items-center">
                                        <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center animate-pulse">
                                            <Loader className="w-5 h-5 text-white animate-spin" />
                                        </div>
                                    </div>
                                    <div className="flex-1 pt-1">
                                        <p className="font-medium text-gray-900">In Transit</p>
                                        <ETACountdown eta={trackedOrder.estimated_eta} status={trackedOrder.status} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {!loading && activeOrders.length === 0 && (
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
