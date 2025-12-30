import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import {
    Package, Clock, Bell, CheckCircle,
    Loader, LogOut, User, ChevronDown, Navigation
} from 'lucide-react';
import Map3D from '../../components/Map3D';
import { Drone, Notification as NotificationType, Order } from '@/lib/types';
import { getDrones, getNoFlyZones, getOperationalZones, getOrders, getRoutes } from '@/lib/api';

type MapRoute = {
    id: number
    path: Array<{ lat: number; lng: number; altitude: number }>
    color?: string
    completed?: boolean
}

type MapZone = {
    id: number
    name: string
    type: 'operational' | 'no-fly'
    polygon: Array<{ lat: number; lng: number }>
    altitudeRange?: { min: number; max: number }
}

const parseLineString = (geojson?: string) => {
    if (!geojson) return [] as Array<{ lat: number; lng: number; altitude: number }>
    try {
        const parsed = JSON.parse(geojson)
        if (parsed?.type === 'LineString' && Array.isArray(parsed.coordinates)) {
            return parsed.coordinates.map((coord: number[]) => ({
                lng: coord[0],
                lat: coord[1],
                altitude: coord[2] ?? 80
            }))
        }
    } catch (error) {
        console.warn('Unable to parse route geometry', error)
    }
    return [] as Array<{ lat: number; lng: number; altitude: number }>
}

const polygonFromGeojson = (geojson?: string) => {
    if (!geojson) return [] as Array<{ lat: number; lng: number }>
    try {
        const parsed = JSON.parse(geojson)
        const rings = parsed.coordinates?.[0] || []
        return rings.map((coord: number[]) => ({ lat: coord[1], lng: coord[0] }))
    } catch (error) {
        console.warn('Unable to parse zone geometry', error)
        return []
    }
}

const mapDronesFromApi = (items: any[]): Drone[] =>
    items
        .filter((d: any) => d.current_position_lat !== null && d.current_position_lng !== null)
        .map((d: any) => ({
            id: d.id,
            serial_number: d.serial_number,
            model: d.model,
            manufacturer: d.manufacturer,
            max_payload_weight: Number(d.max_payload_weight) || 0,
            max_speed: Number(d.max_speed) || 0,
            max_altitude: Number(d.max_altitude) || 0,
            max_range: Number(d.max_range) || 0,
            battery_capacity: Number(d.battery_capacity) || 0,
            status: d.status,
            battery_level: d.battery_level,
            position: {
                lat: Number(d.current_position_lat),
                lng: Number(d.current_position_lng),
                altitude: Number(d.current_altitude ?? 0)
            },
            heading: 0,
            current_altitude: d.current_altitude,
            last_heartbeat: d.last_heartbeat,
            is_active: d.is_active,
            created_at: d.created_at,
            updated_at: d.updated_at,
        }))

const mapRoutesFromApi = (routeItems: any[], statusLookup: Record<number, Order['status']>): MapRoute[] =>
    routeItems
        .map((route: any) => {
            const pathFromLine = parseLineString(route.path_geojson)
            const pathFromWaypoints = (route.waypoints || []).map((wp: any) => ({
                lng: Number(wp.lng),
                lat: Number(wp.lat),
                altitude: Number(wp.altitude ?? 80)
            }))
            const path = pathFromLine.length ? pathFromLine : pathFromWaypoints
            if (!path.length) return null

            const deliveryId = route.delivery_order_id || route.delivery_order || route.id
            const completed = statusLookup[deliveryId] === 'delivered'
            return {
                id: Number(deliveryId),
                path,
                color: completed ? '#22c55e' : '#38bdf8',
                completed,
            }
        })
        .filter(Boolean) as MapRoute[]

const mapZonesFromApi = (operational: any[], noFly: any[]): MapZone[] => {
    const op = operational.map((zone: any) => ({
        id: zone.id,
        name: zone.name,
        type: 'operational' as const,
        polygon: polygonFromGeojson(zone.boundary_geojson),
        altitudeRange: { min: Number(zone.altitude_min) || 0, max: Number(zone.altitude_max ?? 500) }
    }))
    const nf = noFly.map((zone: any) => ({
        id: zone.id,
        name: zone.name,
        type: 'no-fly' as const,
        polygon: polygonFromGeojson(zone.boundary_geojson),
        altitudeRange: { min: Number(zone.altitude_min) || 0, max: Number(zone.altitude_max ?? 500) }
    }))
    return [...op, ...nf]
}

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
    const { logout, user } = useAuthStore();
    const [orders, setOrders] = useState<Order[]>([]);
    const [notifications, setNotifications] = useState<NotificationType[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showUserDropdown, setShowUserDropdown] = useState(false);

    const [drones, setDrones] = useState<Drone[]>([]);
    const [routes, setRoutes] = useState<MapRoute[]>([]);
    const [zones, setZones] = useState<MapZone[]>([]);
    const [followDrone, setFollowDrone] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const activeOrders = useMemo(
        () => orders.filter(o => ['pending', 'assigned', 'in_transit', 'delivering'].includes(o.status)),
        [orders]
    );

    const homePosition = useMemo(() => {
        if (activeOrders.length && activeOrders[0].delivery_lat && activeOrders[0].delivery_lng) {
            return {
                lat: Number(activeOrders[0].delivery_lat),
                lng: Number(activeOrders[0].delivery_lng),
                altitude: 1500,
            }
        }
        return { lat: 12.9716, lng: 77.5946, altitude: 5000 }
    }, [activeOrders])

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    useEffect(() => {
        let cancelled = false

        const loadLiveData = async () => {
            setLoading(true)
            try {
                const [ordersRes, dronesRes] = await Promise.all([getOrders(), getDrones()])
                if (cancelled) return

                const ordersData: Order[] = ordersRes.data || []
                const dronesData = mapDronesFromApi(dronesRes.data || [])

                const statusLookup = ordersData.reduce<Record<number, Order['status']>>((acc, order) => {
                    acc[order.id] = order.status
                    return acc
                }, {})

                const activeIds = ordersData
                    .filter(o => ['pending', 'assigned', 'in_transit', 'delivering'].includes(o.status))
                    .map(o => o.id)

                const routeResponses = await Promise.all(
                    activeIds.map(id =>
                        getRoutes({ delivery_order: id })
                            .then(res => res.data)
                            .catch(() => [])
                    )
                )
                const mappedRoutes = mapRoutesFromApi(routeResponses.flat(), statusLookup)

                let mappedZones: MapZone[] = []
                if (user?.role === 'admin' || user?.role === 'manager') {
                    try {
                        const [operationalRes, noFlyRes] = await Promise.all([
                            getOperationalZones({ is_active: true }),
                            getNoFlyZones({ is_active: true })
                        ])
                        mappedZones = mapZonesFromApi(operationalRes.data || [], noFlyRes.data || [])
                    } catch (zoneError) {
                        console.warn('Zone fetch failed', zoneError)
                        mappedZones = []
                    }
                }

                if (!cancelled) {
                    setOrders(ordersData)
                    setDrones(dronesData)
                    setRoutes(mappedRoutes)
                    setZones(mappedZones)
                    setError(null)
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
        const interval = setInterval(loadLiveData, 10000)
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
                        showLabels={true}
                        showZones={true}
                    />
                </div>

                {/* Tracking Details */}
                {loading && (
                    <div className="flex items-center justify-center py-10 text-gray-500">
                        <Loader className="w-6 h-6 animate-spin mr-3" />
                        Loading live delivery data...
                    </div>
                )}

                {!loading && activeOrders.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                            <h4 className="font-semibold text-gray-900 mb-4">Delivery Details</h4>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Order ID</span>
                                    <span className="font-medium">{activeOrders[0].id}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Destination</span>
                                    <span className="font-medium text-right max-w-[240px]">{activeOrders[0].delivery_address}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Drone</span>
                                    <span className="font-medium">{activeOrders[0].drone_serial_number || 'Unassigned'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Package Weight</span>
                                    <span className="font-medium">{activeOrders[0].package?.weight ?? '—'} kg</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Status</span>
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${activeOrders[0].status === 'in_transit' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                                            activeOrders[0].status === 'assigned' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                                activeOrders[0].status === 'delivering' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                                                    'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                        }`}>
                                        {['in_transit', 'delivering'].includes(activeOrders[0].status) && <Navigation className="w-3 h-3" />}
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
                                        <p className="text-sm text-gray-500">{new Date(activeOrders[0].requested_at).toLocaleString()}</p>
                                    </div>
                                </div>

                                {activeOrders[0].assigned_at && (
                                    <div className="flex gap-3">
                                        <div className="flex flex-col items-center">
                                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                                <CheckCircle className="w-5 h-5 text-white" />
                                            </div>
                                            <div className="w-0.5 h-12 bg-purple-500" />
                                        </div>
                                        <div className="flex-1 pt-1">
                                            <p className="font-medium text-gray-900">Drone Assigned</p>
                                            <p className="text-sm text-gray-500">Drone {activeOrders[0].drone_serial_number || activeOrders[0].drone} assigned</p>
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
                                        <ETACountdown eta={activeOrders[0].estimated_eta} status={activeOrders[0].status} />
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
