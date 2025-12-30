export interface Drone {
    id?: number;
    serial_number: string;
    model: string;
    manufacturer: string;
    max_payload_weight: number;
    max_speed: number;
    max_altitude: number;
    max_range: number;
    battery_capacity: number;
    status?: 'idle' | 'charging' | 'assigned' | 'delivering' | 'returning' | 'maintenance' | 'offline';
    battery_level?: number;
    current_position_lat?: number;
    current_position_lng?: number;
    current_altitude?: number;
    position: {
        lat: number;
        lng: number;
        altitude: number;
    };
    heading?: number;
    pitch?: number;
    roll?: number;
    battery?: number;
    last_heartbeat?: string;
    notes?: string;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
    locationId?: number; // For UI only - maps to home base location
    home_base?: string; // Home base location name
}

export interface Zone {
    id?: number;
    name: string;
    type: 'operational' | 'no-fly' | 'warning';
    description?: string;
    polygon: Array<{ lat: number; lng: number }>;
    shape?: 'polygon' | 'circle';
    center?: { lat: number; lng: number };
    radius?: number; // meters, when shape is circle
    altitudeRange?: { min: number; max?: number };
    zoneType?: 'airport' | 'military' | 'government' | 'private' | 'weather' | 'temporary';
    isActive?: boolean;
    validFrom?: string;
    validUntil?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface Notification {
    id: number;
    user: number | { id: number; username?: string };
    notification_type: 'delivery_update' | 'drone_status' | 'system_alert' | 'maintenance' | 'weather';
    title: string;
    message: string;
    is_read: boolean;
    related_object_id?: number | null;
    related_object_type?: string | null;
    created_at: string;
    read_at?: string | null;
}

export interface Route {
    id?: number;
    orderId: number;
    path: Array<{ lat: number; lng: number; altitude: number }>;
    totalDistance: number;
    estimatedDuration: number;
    estimatedEta: string;
    confidenceScore?: number;
    optimizationMethod?: string;
    avoidsNoFlyZones?: boolean;
    avoidsWeatherHazards?: boolean;
    altitudeProfile?: Record<string, any>;
    waypoints?: Waypoint[];
    createdAt?: string;
    updatedAt?: string;
}

export interface Waypoint {
    id?: number;
    routeId: number;
    sequence: number;
    position: { lat: number; lng: number };
    altitude: number;
    action?: string;
    estimatedArrival?: string;
}

export interface Order {
    id: number;
    customer: number | { id: number; username?: string };
    pickup_address: string;
    pickup_location: { type: string; coordinates: [number, number] } | null; // GeoJSON Point: [lng, lat]
    delivery_address: string;
    delivery_location: { type: string; coordinates: [number, number] } | null;
    pickup_lat?: number | null;
    pickup_lng?: number | null;
    delivery_lat?: number | null;
    delivery_lng?: number | null;
    package: {
        id?: number;
        name?: string;
        description?: string | null;
        package_type?: string;
        weight?: number;
        dimensions_length?: number | null;
        dimensions_width?: number | null;
        dimensions_height?: number | null;
        is_fragile?: boolean;
        is_urgent?: boolean;
    } | null;
    drone?: number | null;
    drone_serial_number?: string | null;
    status: 'pending' | 'assigned' | 'in_transit' | 'delivering' | 'delivered' | 'failed' | 'cancelled';
    requested_at: string;
    assigned_at?: string | null;
    picked_up_at?: string | null;
    delivered_at?: string | null;
    estimated_eta?: string | null;
    actual_delivery_time?: string | null;
    optimized_route?: number | null;
    priority?: number;
    notes?: string | null;
}

export interface User {
    id?: number;
    username: string;
    email?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    role: 'admin' | 'manager' | 'customer';
    phone_number?: string | null;
    address?: string | null;
    is_active?: boolean;
    is_staff?: boolean;
    is_superuser?: boolean;
    last_login?: string | null;
    date_joined?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
}

export interface WeatherData {
    id: number
    location: string
    lat?: number
    lng?: number
    temperature: number
    humidity: number
    windSpeed: number
    windDirection: string
    visibility: number
    conditions: 'clear' | 'cloudy' | 'rainy' | 'stormy'
    pressure: number
    lastUpdated: string
    alerts?: string[]
}

export interface ForecastEntry {
    timestamp: string
    temperature: number
    conditions: WeatherData['conditions']
    windSpeed: number
    humidity: number
    precipitation?: number | null
}

export interface WeatherForecast {
    location: string
    lat: number
    lng: number
    hourly: ForecastEntry[]
}

export interface Log {
    id: number;
    timestamp: string;
    level: 'debug' | 'info' | 'warning' | 'error' | 'critical';
    level_display: string;
    service: string;
    message: string;
    correlation_id: string | null;
    user_username?: string | null;
    metadata?: Record<string, any>;
}