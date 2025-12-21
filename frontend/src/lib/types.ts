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
}

export interface Zone {
    id?: number;
    name: string;
    type: 'operational' | 'no-fly';
    description?: string;
    polygon: Array<{ lat: number; lng: number }>;
    altitudeRange?: { min: number; max?: number };
    zoneType?: 'airport' | 'military' | 'government' | 'private' | 'weather' | 'temporary';
    isActive?: boolean;
    validFrom?: string;
    validUntil?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface Notification {
    id?: number;
    userId: number;
    type: 'delivery_update' | 'drone_status' | 'system_alert' | 'maintenance' | 'weather';
    title: string;
    message: string;
    isRead?: boolean;
    relatedObjectId?: number;
    relatedObjectType?: string;
    createdAt?: string;
    readAt?: string;
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
    id?: number;
    customerId: number;
    pickupLocation: { lat: number; lng: number; address: string };
    deliveryLocation: { lat: number; lng: number; address: string };
    packageDetails: {
        weight: number;
        dimensions?: { length: number; width: number; height: number };
        description?: string;
        value?: number;
    };
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled' | 'failed';
    assignedDroneId?: number;
    estimatedDeliveryTime?: string;
    actualDeliveryTime?: string;
    trackingNumber?: string;
    specialInstructions?: string;
    createdAt?: string;
    updatedAt?: string;
}

