import { Drone, Order } from './types'

export type MapRoute = {
    id: number
    path: Array<{ lat: number; lng: number; altitude: number }>
    color?: string
    completed?: boolean
}

export type MapZone = {
    id: number
    name: string
    type: 'operational' | 'no-fly'
    polygon: Array<{ lat: number; lng: number }>
    center?: { lat: number; lng: number }
    radiusMeters?: number
    altitudeRange?: { min: number; max: number }
}

export const ACTIVE_ORDER_STATUSES: Array<Order['status']> = [
    'pending',
    'assigned',
    'in_transit',
    'delivering',
]

export const parseLineString = (geojson?: string) => {
    if (!geojson) return [] as Array<{ lat: number; lng: number; altitude: number }>
    try {
        const parsed = JSON.parse(geojson)
        if (parsed?.type === 'LineString' && Array.isArray(parsed.coordinates)) {
            return parsed.coordinates.map((coord: number[]) => ({
                lng: coord[0],
                lat: coord[1],
                altitude: coord[2] ?? 80,
            }))
        }
    } catch (error) {
        console.warn('Unable to parse route geometry', error)
    }
    return [] as Array<{ lat: number; lng: number; altitude: number }>
}

export const polygonFromGeojson = (geojson?: string) => {
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

export const toRadians = (deg: number) => (deg * Math.PI) / 180

export const haversineMeters = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
    const R = 6371000 // meters
    const dLat = toRadians(b.lat - a.lat)
    const dLng = toRadians(b.lng - a.lng)
    const lat1 = toRadians(a.lat)
    const lat2 = toRadians(b.lat)
    const sinDLat = Math.sin(dLat / 2)
    const sinDLng = Math.sin(dLng / 2)
    const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}

export const polygonToCircleApprox = (polygon: Array<{ lat: number; lng: number }>) => {
    if (!polygon.length) return { center: undefined as undefined | { lat: number; lng: number }, radiusMeters: undefined as number | undefined }
    const center = polygon.reduce((acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }), { lat: 0, lng: 0 })
    center.lat /= polygon.length
    center.lng /= polygon.length
    const radiusMeters = polygon.reduce((max, p) => Math.max(max, haversineMeters(center, p)), 0) || 500
    return { center, radiusMeters }
}

export const mapDronesFromApi = (items: any[]): Drone[] =>
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
                altitude: Number(d.current_altitude ?? 0),
            },
            heading: 0,
            current_altitude: d.current_altitude,
            last_heartbeat: d.last_heartbeat,
            is_active: d.is_active,
            created_at: d.created_at,
            updated_at: d.updated_at,
        }))

export const mapRoutesFromApi = (
    routeItems: any[],
    statusLookup: Record<number, Order['status']>,
): MapRoute[] =>
    routeItems
        .map((route: any) => {
            const pathFromLine = parseLineString(route.path_geojson)
            const pathFromWaypoints = (route.waypoints || []).map((wp: any) => ({
                lng: Number(wp.lng),
                lat: Number(wp.lat),
                altitude: Number(wp.altitude ?? 80),
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

export const mapZonesFromApi = (operational: any[] | any, noFly: any[] | any): MapZone[] => {
    const opSource = Array.isArray(operational) ? operational : []
    const nfSource = Array.isArray(noFly) ? noFly : []

    const op = opSource.map((zone: any) => {
        const polygon = polygonFromGeojson(zone.boundary_geojson)
        const circle = polygonToCircleApprox(polygon)
        return {
            id: zone.id,
            name: zone.name,
            type: 'operational' as const,
            polygon,
            center: circle.center,
            radiusMeters: circle.radiusMeters,
            altitudeRange: { min: Number(zone.altitude_min) || 0, max: Number(zone.altitude_max ?? 500) },
        }
    })
    const nf = nfSource.map((zone: any) => {
        const polygon = polygonFromGeojson(zone.boundary_geojson)
        const circle = polygonToCircleApprox(polygon)
        return {
            id: zone.id,
            name: zone.name,
            type: 'no-fly' as const,
            polygon,
            center: circle.center,
            radiusMeters: circle.radiusMeters,
            altitudeRange: { min: Number(zone.altitude_min) || 0, max: Number(zone.altitude_max ?? 500) },
        }
    })
    return [...op, ...nf]
}

export const extractLatLng = (pointField: any, fallbackLat?: number | null, fallbackLng?: number | null) => {
    if (pointField?.type === 'Point' && Array.isArray(pointField.coordinates)) {
        return { lng: Number(pointField.coordinates[0]), lat: Number(pointField.coordinates[1]) }
    }
    if (fallbackLat != null && fallbackLng != null) {
        return { lat: Number(fallbackLat), lng: Number(fallbackLng) }
    }
    return null
}

export const buildFallbackRoute = (order: Order, drones: Drone[]): MapRoute | null => {
    const pickup = extractLatLng(order.pickup_location, order.pickup_lat, order.pickup_lng)
    const drop = extractLatLng(order.delivery_location, order.delivery_lat, order.delivery_lng)
    if (!pickup || !drop) return null

    const assigned = order.drone ? drones.find((d) => d.id === order.drone) : undefined
    const candidates = assigned ? [assigned] : drones.filter((d) => ['idle', 'assigned', 'returning'].includes(d.status || ''))

    const start = candidates.length
        ? candidates.reduce((best, d) => {
            if (!d.position) return best
            const dist = haversineMeters({ lat: d.position.lat, lng: d.position.lng }, pickup)
            if (!best || dist < best.dist) return { dist, drone: d }
            return best
        }, null as null | { dist: number; drone: Drone })?.drone?.position || pickup
        : pickup

    const path = [start, pickup, drop].map((p) => ({ lat: p.lat, lng: p.lng, altitude: 120 }))

    return {
        id: order.id,
        path,
        color: '#f97316',
        completed: order.status === 'delivered',
    }
}
