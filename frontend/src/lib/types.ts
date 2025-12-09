export interface Drone {
    id?: number;
    serial_number: string;
    model: string;
    manufacturer: string;
    max_payload_weight: string;
    max_speed: string;
    max_altitude: string;
    max_range: string;
    battery_capacity: string;
    status?: 'active' | 'idle' | 'maintenance' | 'inactive' | 'error';
    battery_level?: number;
    current_altitude?: string;
    last_heartbeat?: string;
    notes?: string;
    is_active?: boolean;
}

