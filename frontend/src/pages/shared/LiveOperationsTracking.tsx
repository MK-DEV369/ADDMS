import { useEffect, useMemo, useRef, useState } from 'react'
import { Loader, Navigation, Plane, Layers } from 'lucide-react'
import Map3D from '@/components/Map3D'
import { Drone, Order } from '@/lib/types'
import { getDrones, getNoFlyZones, getOperationalZones, getOrders, getRoutes } from '@/lib/api'
import {
    ACTIVE_ORDER_STATUSES,
    MapRoute,
    MapZone,
    buildFallbackRoute,
    mapDronesFromApi,
    mapRoutesFromApi,
    mapZonesFromApi,
    haversineMeters,
} from '@/lib/trackingUtils'

const normalizeArray = (payload: any) =>
    Array.isArray(payload?.results)
        ? payload.results
        : Array.isArray(payload)
            ? payload
            : []

const statusBadge = (status: Order['status']) => {
    const base = 'inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border'
    switch (status) {
        case 'in_transit':
            return `${base} bg-purple-100 text-purple-800 border-purple-200`
        case 'delivering':
            return `${base} bg-amber-100 text-amber-800 border-amber-200`
        case 'assigned':
            return `${base} bg-blue-100 text-blue-800 border-blue-200`
        case 'pending':
        default:
            return `${base} bg-gray-100 text-gray-800 border-gray-200`
    }
}

type Props = {
    audience: 'Admin' | 'Manager'
}

export default function LiveOperationsTracking({ audience }: Props) {
    const [orders, setOrders] = useState<Order[]>([])
    const [drones, setDrones] = useState<Drone[]>([])
    const [routes, setRoutes] = useState<MapRoute[]>([])
    const [zones, setZones] = useState<MapZone[]>([])
    const [followDrone, setFollowDrone] = useState<number | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const simStateRef = useRef<Record<number, { phase: 'outbound' | 'dwell' | 'return' | 'done'; startedAt: number; dwellUntil?: number }>>({})
    
    // FIX 1: Visual throttle - update Map3D at lower FPS to prevent framebuffer churn
    const [visualDrones, setVisualDrones] = useState<Drone[]>([])
    const [visualRoutes, setVisualRoutes] = useState<MapRoute[]>([])
    const [visualZones, setVisualZones] = useState<MapZone[]>([])
    const mapActiveRef = useRef(true) // FIX 3: Track if Map3D is active

    const activeOrders = useMemo(
        () => orders.filter((o) => ACTIVE_ORDER_STATUSES.includes(o.status)),
        [orders],
    )

    const homePosition = useMemo(() => {
        const first = activeOrders[0]
        if (first?.delivery_lat && first.delivery_lng) {
            return {
                lat: Number(first.delivery_lat),
                lng: Number(first.delivery_lng),
                altitude: 6000,
            }
        }
        return { lat: 12.9716, lng: 77.5946, altitude: 12000 }
    }, [activeOrders])

    const droneCounts = useMemo(() => {
        const byStatus = drones.reduce<Record<string, number>>((acc, d) => {
            const key = d.status || 'unknown'
            acc[key] = (acc[key] || 0) + 1
            return acc
        }, {})
        return {
            total: drones.length,
            delivering: byStatus['delivering'] || 0,
            returning: byStatus['returning'] || 0,
            offline: byStatus['offline'] || 0,
        }
    }, [drones])

    // FIX 2: Deep comparison helper to prevent unnecessary rebuilds
    const areArraysEqual = (a: any[], b: any[]): boolean => {
        if (a.length !== b.length) return false
        // Compare IDs for routes/zones, full object for drones
        return a.every((item, idx) => {
            const other = b[idx]
            if (item.id !== undefined && other.id !== undefined) {
                return item.id === other.id
            }
            return JSON.stringify(item) === JSON.stringify(other)
        })
    }

    // FIX 1: Throttle visual updates to Map3D (every 2 seconds instead of every tick)
    useEffect(() => {
        console.debug('🎨 Visual throttle: Updating Map3D props every 2 seconds')
        const visualUpdateId = setInterval(() => {
            if (!mapActiveRef.current) {
                console.debug('⏸️ Map inactive, skipping visual update')
                return
            }
            
            console.debug('🔄 Visual update tick', {
                drones: drones.length,
                routes: routes.length,
                zones: zones.length
            })
            
            setVisualDrones(prev => areArraysEqual(prev, drones) ? prev : [...drones])
            setVisualRoutes(prev => areArraysEqual(prev, routes) ? prev : [...routes])
            setVisualZones(prev => areArraysEqual(prev, zones) ? prev : [...zones])
        }, 2000) // 👈 Visual throttle: 2 seconds

        return () => clearInterval(visualUpdateId)
    }, [drones, routes, zones])

    // FIX 3: Cleanup handler to pause simulation on unmount
    useEffect(() => {
        mapActiveRef.current = true
        console.debug('🗺️ Map3D mounted, simulation active')
        
        return () => {
            mapActiveRef.current = false
            console.debug('🛑 Map3D unmounting, pausing simulation')
        }
    }, [])

    useEffect(() => {
        let cancelled = false

        const fetchLocalZones = async (): Promise<MapZone[]> => {
            try {
                const res = await fetch('/zones.json')
                if (!res.ok) return []
                const data = await res.json()
                if (!Array.isArray(data)) return []
                return data
                    .filter((z: any) => z.isActive !== false)
                    .map((z: any) => ({
                        id: z.id,
                        name: z.name,
                        type: (z.type === 'no-fly' ? 'no-fly' : 'operational') as MapZone['type'],
                        polygon: Array.isArray(z.polygon) ? z.polygon : [],
                        center: z.center,
                        radiusMeters: z.radius || z.radiusMeters,
                        altitudeRange: z.altitudeRange,
                    }))
            } catch (e) {
                console.warn('zones.json fallback failed', e)
                return []
            }
        }

        const loadLiveData = async () => {
            setLoading(true)
            try {
                const [ordersRes, dronesRes, operationalRes, noFlyRes] = await Promise.all([
                    getOrders(),
                    getDrones(),
                    getOperationalZones({ is_active: true }),
                    getNoFlyZones({ is_active: true }),
                ])
                if (cancelled) return

                const ordersData: Order[] = normalizeArray(ordersRes.data)
                const dronesData = mapDronesFromApi(normalizeArray(dronesRes.data))
                const statusLookup = ordersData.reduce<Record<number, Order['status']>>((acc, order) => {
                    acc[order.id] = order.status
                    return acc
                }, {})

                console.debug('📥 Live data received', {
                    orders: ordersData.length,
                    drones: dronesData.length,
                    operationalZonesRaw: operationalRes.data,
                    noFlyZonesRaw: noFlyRes.data,
                })

                const activeIds = ordersData
                    .filter((o) => ACTIVE_ORDER_STATUSES.includes(o.status))
                    .map((o) => o.id)

                const routeResponses = activeIds.length
                    ? await Promise.all(
                        activeIds.map((id) =>
                            getRoutes({ delivery_order: id })
                                .then((res) => res.data)
                                .catch(() => []),
                        ),
                    )
                    : []

                const mappedRoutes = mapRoutesFromApi(normalizeArray(routeResponses.flat()), statusLookup)

                const fallbackRoutes = activeIds
                    .filter((id) => !mappedRoutes.find((r) => r.id === id))
                    .map((id) => {
                        const order = ordersData.find((o) => o.id === id)
                        return order ? buildFallbackRoute(order, dronesData) : null
                    })
                    .filter(Boolean) as MapRoute[]

                const operationalData = normalizeArray(operationalRes.data)
                const noFlyData = normalizeArray(noFlyRes.data)
                let mappedZones = mapZonesFromApi(operationalData, noFlyData)

                if (!mappedZones.length) {
                    const fallbackZones = await fetchLocalZones()
                    mappedZones = fallbackZones
                }

                console.debug('📊 Processed live data', {
                    activeOrders: activeIds.length,
                    routes: mappedRoutes.length,
                    fallbackRoutes: fallbackRoutes.length,
                    zones: mappedZones.length,
                })

                if (!cancelled) {
                    // FIX 2: Only update if data actually changed
                    const nextRoutes = [...mappedRoutes, ...fallbackRoutes]
                    
                    console.debug('🔄 Checking for data changes before state update')
                    
                    setOrders(ordersData)
                    
                    // FIX 2: Compare routes before updating
                    setRoutes(prev => {
                        if (areArraysEqual(prev, nextRoutes)) {
                            console.debug('✅ Routes unchanged, preserving reference')
                            return prev
                        }
                        console.debug('🔄 Routes changed, updating')
                        return nextRoutes
                    })
                    
                    setDrones(dronesData)
                    
                    // FIX 2: Compare zones before updating
                    setZones(prev => {
                        if (areArraysEqual(prev, mappedZones)) {
                            console.debug('✅ Zones unchanged, preserving reference')
                            return prev
                        }
                        console.debug('🔄 Zones changed, updating')
                        return mappedZones
                    })
                    
                    setError(null)
                    setFollowDrone((prev) => (dronesData.some((d) => d.id === prev) ? prev : null))
                }
            } catch (err) {
                if (!cancelled) {
                    console.error('Failed to load live operations data', err)
                    setError('Unable to load live operations data right now.')
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
    }, [])

    // Lightweight front-end simulation for drone motion and status cycling
    useEffect(() => {
        const tickMs = 1000
        const speedMps = 25 // ~90 km/h for smoother visible movement
        const dwellMs = 10000

        const computeSegments = (path: MapRoute['path']) => {
            const segs: { dist: number; from: any; to: any }[] = []
            for (let i = 0; i < path.length - 1; i += 1) {
                const from = path[i]
                const to = path[i + 1]
                const dist = haversineMeters({ lat: from.lat, lng: from.lng }, { lat: to.lat, lng: to.lng })
                segs.push({ dist, from, to })
            }
            const total = segs.reduce((s, a) => s + a.dist, 0)
            return { segs, total }
        }

        const interpolate = (segs: { dist: number; from: any; to: any }[], total: number, progress: number) => {
            let covered = total * progress
            for (const seg of segs) {
                if (covered > seg.dist) {
                    covered -= seg.dist
                    continue
                }
                const t = seg.dist ? covered / seg.dist : 0
                return {
                    lat: seg.from.lat + (seg.to.lat - seg.from.lat) * t,
                    lng: seg.from.lng + (seg.to.lng - seg.from.lng) * t,
                    altitude: Math.max(30, (seg.from.altitude || 80) + ((seg.to.altitude || 80) - (seg.from.altitude || 80)) * t),
                }
            }
            return segs.length ? segs[segs.length - 1].to : null
        }

        const timer = setInterval(() => {
            // FIX 3: Pause simulation if Map3D is unmounted
            if (!mapActiveRef.current) {
                console.debug('⏸️ Simulation paused - Map3D inactive')
                return
            }
            
            setDrones((prev) => {
                const now = Date.now()
                const activeOrdersById = new Map<number, Order>()
                orders.forEach((o) => {
                    if (ACTIVE_ORDER_STATUSES.includes(o.status) && o.drone) activeOrdersById.set(o.drone, o)
                })

                return prev.map((drone) => {
                    // Battery safeguard
                    if ((drone.battery_level ?? 100) < 15) {
                        return {
                            ...drone,
                            status: 'charging',
                            position: {
                                lat: drone.position?.lat || homePosition.lat,
                                lng: drone.position?.lng || homePosition.lng,
                                altitude: 0,
                            },
                        }
                    }

                    const order = activeOrdersById.get(drone.id || -1)
                    if (!order) return drone

                    const route = routes.find((r) => r.id === order.id)
                    if (!route || route.path.length < 2) {
                        console.debug('🧭 No usable route for drone', { drone: drone.id, routeId: route?.id })
                        return drone
                    }

                    const key = route.id
                    const state = simStateRef.current[key] || { phase: 'outbound' as const, startedAt: now }
                    const { segs, total } = computeSegments(route.path)
                    const travelMs = (total / speedMps) * 1000

                    let nextState = state
                    let position = drone.position
                    let status = drone.status

                    if (state.phase === 'outbound') {
                        const progress = Math.min(1, (now - state.startedAt) / travelMs)
                        position = interpolate(segs, total, progress) || position
                        status = 'delivering'
                        if (progress >= 1) {
                            nextState = { phase: 'dwell', startedAt: now, dwellUntil: now + dwellMs }
                        }
                    } else if (state.phase === 'dwell') {
                        position = route.path[route.path.length - 1]
                        status = 'delivering'
                        if (state.dwellUntil && now >= state.dwellUntil) {
                            nextState = { phase: 'return', startedAt: now }
                        }
                    } else if (state.phase === 'return') {
                        const revPath = [...route.path].reverse()
                        const { segs: revSegs, total: revTotal } = computeSegments(revPath)
                        const progress = Math.min(1, (now - state.startedAt) / travelMs)
                        position = interpolate(revSegs, revTotal, progress) || revPath[revPath.length - 1]
                        status = 'returning'
                        if (progress >= 1) {
                            nextState = { phase: 'done', startedAt: now }
                        }
                    } else {
                        position = route.path[0]
                        status = 'idle'
                    }

                    simStateRef.current[key] = nextState

                    const nextDrone = {
                        ...drone,
                        status,
                        position: position || drone.position,
                    }

                    if (Math.random() < 0.05) {
                        console.debug('🛰️ Sim tick', { drone: drone.id, status: nextDrone.status, pos: nextDrone.position, phase: nextState.phase })
                    }

                    return nextDrone
                })
            })
        }, tickMs)

        return () => clearInterval(timer)
    }, [orders, routes, homePosition])

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h2 className="text-xl font-semibold text-gray-900">Live Tracking ({audience})</h2>
                <p className="text-sm text-gray-600">All drones, active delivery routes, and restricted zones in one view.</p>
                {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
                )}
            </div>

            <div className="bg-gray-900 rounded-xl overflow-hidden" style={{ height: '650px' }}>
                <Map3D
                    drones={visualDrones}
                    routes={visualRoutes}
                    zones={visualZones}
                    homePosition={homePosition}
                    followDrone={followDrone}
                    onDroneClick={(droneId) => setFollowDrone(droneId === followDrone ? null : droneId)}
                    onCollisionDetected={(collision) => {
                        console.error('🚨 Collision reported to LiveOperationsTracking:', collision)
                        // Could trigger additional actions here like updating backend, sending alerts, etc.
                    }}
                    showLabels
                    showZones
                />
            </div>

            {loading && (
                <div className="flex items-center justify-center py-8 text-gray-500">
                    <Loader className="w-5 h-5 animate-spin mr-2" />
                    Syncing live data...
                </div>
            )}

            {!loading && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg"><Plane className="w-5 h-5" /></div>
                            <div>
                                <div className="text-xs text-gray-500">Total Drones</div>
                                <div className="text-lg font-semibold text-gray-900">{droneCounts.total}</div>
                            </div>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-3">
                            <div className="p-2 bg-green-50 text-green-700 rounded-lg"><Navigation className="w-5 h-5" /></div>
                            <div>
                                <div className="text-xs text-gray-500">Delivering</div>
                                <div className="text-lg font-semibold text-gray-900">{droneCounts.delivering}</div>
                            </div>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-3">
                            <div className="p-2 bg-amber-50 text-amber-700 rounded-lg"><Navigation className="w-5 h-5 rotate-180" /></div>
                            <div>
                                <div className="text-xs text-gray-500">Returning</div>
                                <div className="text-lg font-semibold text-gray-900">{droneCounts.returning}</div>
                            </div>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-3">
                            <div className="p-2 bg-gray-100 text-gray-700 rounded-lg"><Layers className="w-5 h-5" /></div>
                            <div>
                                <div className="text-xs text-gray-500">Active Orders</div>
                                <div className="text-lg font-semibold text-gray-900">{activeOrders.length}</div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <p className="text-sm text-gray-500">Active Orders</p>
                                    <p className="text-lg font-semibold text-gray-900">{activeOrders.length}</p>
                                </div>
                            </div>
                            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                                {activeOrders.length === 0 && (
                                    <p className="text-sm text-gray-500">No active deliveries in progress.</p>
                                )}
                                {activeOrders.map((order) => (
                                    <div key={order.id} className="border border-gray-200 rounded-lg p-3 hover:border-indigo-200 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className="font-semibold text-gray-900">Order #{order.id}</div>
                                            <span className={statusBadge(order.status)}>{order.status.replace('_', ' ').toUpperCase()}</span>
                                        </div>
                                        <div className="text-sm text-gray-600 mt-1">Destination: {order.delivery_address}</div>
                                        <div className="text-sm text-gray-500 mt-1">Drone: {order.drone_serial_number || 'Unassigned'}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <p className="text-sm text-gray-500">Drones (with location)</p>
                                    <p className="text-lg font-semibold text-gray-900">{drones.length}</p>
                                </div>
                            </div>
                            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                                {drones.length === 0 && <p className="text-sm text-gray-500">No drones with live location data.</p>}
                                {drones.map((drone) => (
                                    <button
                                        key={drone.id}
                                        onClick={() => setFollowDrone(drone.id === followDrone ? null : drone.id ?? null)}
                                        className={`w-full text-left border rounded-lg p-3 transition-colors ${followDrone === drone.id ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200 hover:border-indigo-200'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="font-semibold text-gray-900">{drone.serial_number}</div>
                                            <span className="text-xs text-gray-600 capitalize">{drone.status || 'unknown'}</span>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            Battery: {drone.battery_level ?? '—'}% · Alt: {drone.position?.altitude?.toFixed(0)}m
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
