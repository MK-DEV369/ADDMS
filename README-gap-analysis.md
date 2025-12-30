# ADDMS Gap Analysis & Real Data Guide

This add-on README tracks what is still unfinished, pinpoints the remaining mock data, and supplies realistic payloads you can seed or hit via the API. Use it alongside the main README while wiring the UI to live endpoints.

## Remaining Problems (priority-ordered)
- **Frontend still mocked:** Fleet, deliveries, analytics, and zones pages read local arrays instead of calling the API (see file list below). Types are slightly out of sync with backend serializers (e.g., `Order` shape vs. delivery serializer).
- **Realtime gaps:** No WebSocket client yet for `/ws/tracking/`; telemetry pages cannot stream live drone positions.
- **Mapping placeholder:** `components/Map3D.tsx` has no Cesium initialization or entity rendering.
- **Backend TODOs:** Weather task unimplemented, TimescaleDB hypertable conversion not run, route optimizer/ETA model still rule-based, WebSocket auth missing (see IMPLEMENTATION_NOTES.md for detail).
- **Testing missing:** No backend or frontend automated tests; no E2E.
- **Ops readiness:** No production env examples, logging/alerting pipelines not configured, Redis/PostGIS/Timescale prerequisites not auto-checked.

## Where Mock Data Lives (replace with API calls)
- Manager dashboards: [frontend/src/pages/manager/FleetMonitor.tsx](frontend/src/pages/manager/FleetMonitor.tsx), [frontend/src/pages/manager/Deliveries.tsx](frontend/src/pages/manager/Deliveries.tsx), [frontend/src/pages/manager/Analytics.tsx](frontend/src/pages/manager/Analytics.tsx)
- Admin dashboards: [frontend/src/pages/admin/Analytics.tsx](frontend/src/pages/admin/Analytics.tsx), [frontend/src/pages/admin/Zones.tsx](frontend/src/pages/admin/Zones.tsx)

## Sample “Real” Payloads (copy/paste ready)
All coordinates are `lon, lat` in WGS84.

### Drones (POST `/api/drones/drones/`)
```json
[
  {
    "serial_number": "BLR-M300-0001",
    "model": "DJI Matrice 300 RTK",
    "manufacturer": "DJI",
    "max_payload_weight": 2.70,
    "max_speed": 82,
    "max_altitude": 500,
    "max_range": 15,
    "battery_capacity": 5935,
    "status": "delivering",
    "battery_level": 76,
    "current_position": {"type": "Point", "coordinates": [77.5946, 12.9716]},
    "current_altitude": 85.2,
    "last_heartbeat": "2025-01-15T09:24:00Z",
    "notes": "Carrying temperature-sensitive meds",
    "is_active": true
  },
  {
    "serial_number": "BLR-M300-0002",
    "model": "DJI Matrice 300 RTK",
    "manufacturer": "DJI",
    "max_payload_weight": 2.70,
    "max_speed": 82,
    "max_altitude": 500,
    "max_range": 15,
    "battery_capacity": 5935,
    "status": "idle",
    "battery_level": 92,
    "current_position": {"type": "Point", "coordinates": [77.6670, 12.9569]},
    "current_altitude": 2.0,
    "last_heartbeat": "2025-01-15T09:26:00Z",
    "notes": "At Whitefield hub",
    "is_active": true
  },
  {
    "serial_number": "BLR-ANAFI-0101",
    "model": "Parrot Anafi USA",
    "manufacturer": "Parrot",
    "max_payload_weight": 0.80,
    "max_speed": 55,
    "max_altitude": 400,
    "max_range": 12,
    "battery_capacity": 3400,
    "status": "maintenance",
    "battery_level": 18,
    "current_position": {"type": "Point", "coordinates": [77.5800, 12.9350]},
    "current_altitude": 0.0,
    "last_heartbeat": "2025-01-15T08:55:00Z",
    "notes": "Motor vibration flagged",
    "is_active": false
  }
]
```

### Delivery Orders (POST `/api/deliveries/orders/`)
Each order nests a package. Use either `pickup_lat`/`pickup_lng` & `delivery_lat`/`delivery_lng` **or** GeoJSON objects via `pickup_location_data`/`delivery_location_data`.
```json
{
  "customer": 12,
  "pickup_address": "Manipal Hospital, HAL Old Airport Rd, Bengaluru",
  "pickup_lat": 12.9581,
  "pickup_lng": 77.6482,
  "delivery_address": "Prestige Shantiniketan, Whitefield, Bengaluru",
  "delivery_lat": 12.9924,
  "delivery_lng": 77.7282,
  "package": {
    "name": "Insulin vials",
    "description": "Cold chain, keep under 8C",
    "package_type": "medical",
    "weight": 1.10,
    "dimensions_length": 25.0,
    "dimensions_width": 18.0,
    "dimensions_height": 12.0,
    "is_fragile": true,
    "is_urgent": true,
    "requires_temperature_control": true,
    "temperature_range": "2-8C"
  },
  "status": "assigned",
  "priority": 4,
  "drone": 2,
  "estimated_eta": "2025-01-15T09:55:00Z",
  "notes": "Avoid airport TFR zone"
}
```
Second example (delivered order):
```json
{
  "customer": 18,
  "pickup_address": "Amazon BLR4, Devanahalli",
  "pickup_lat": 13.1472,
  "pickup_lng": 77.6974,
  "delivery_address": "Manyata Tech Park, Nagawara",
  "delivery_lat": 13.0361,
  "delivery_lng": 77.6246,
  "package": {
    "name": "Laptop",
    "description": "15-inch, shock protected",
    "package_type": "electronics",
    "weight": 2.30,
    "dimensions_length": 40.0,
    "dimensions_width": 30.0,
    "dimensions_height": 8.0,
    "is_fragile": true,
    "is_urgent": false,
    "requires_temperature_control": false
  },
  "status": "delivered",
  "priority": 2,
  "drone": 1,
  "estimated_eta": "2025-01-14T17:10:00Z",
  "actual_delivery_time": "2025-01-14T17:05:00Z",
  "notes": "Delivered at reception"
}
```

### Zones (POST `/api/zones/operational/` and `/api/zones/no-fly/`)
```json
{
  "name": "Whitefield Service Area",
  "description": "Primary residential delivery catchment",
  "boundary": {
    "type": "Polygon",
    "coordinates": [
      [
        [77.7200, 12.9600],
        [77.7500, 12.9600],
        [77.7500, 13.0050],
        [77.7200, 13.0050],
        [77.7200, 12.9600]
      ]
    ]
  },
  "altitude_min": 50,
  "altitude_max": 120,
  "is_active": true
}
```
```json
{
  "name": "Kempegowda Airport NFZ",
  "description": "DGCA-published controlled airspace",
  "zone_type": "airport",
  "boundary": {
    "type": "Polygon",
    "coordinates": [
      [
        [77.6500, 13.1650],
        [77.7400, 13.1650],
        [77.7400, 13.2450],
        [77.6500, 13.2450],
        [77.6500, 13.1650]
      ]
    ]
  },
  "altitude_min": 0,
  "altitude_max": 500,
  "is_active": true,
  "valid_from": "2025-01-01T00:00:00Z",
  "valid_until": null
}
```

### Telemetry Snapshot (seed via Django shell or fixture)
```json
{
  "drone": 1,
  "timestamp": "2025-01-15T09:30:12Z",
  "position": {"type": "Point", "coordinates": [77.6123, 12.9821]},
  "altitude": 82.4,
  "heading": 134.5,
  "speed": 46.2,
  "battery_level": 73,
  "battery_voltage": 15.8,
  "temperature": 28.4,
  "wind_speed": 6.2,
  "wind_direction": 210.0,
  "is_in_flight": true,
  "gps_signal_strength": 94
}
```

### Analytics Rollup (for UI fallback without backend aggregation)
```json
{
  "kpis": {
    "active_deliveries": 18,
    "completed_today": 142,
    "avg_delivery_time_minutes": 21.4,
    "on_time_rate_pct": 93.8,
    "total_drones": 12,
    "active_drones": 9,
    "avg_battery_pct": 71,
    "maintenance_count": 2
  },
  "deliveries_last_30_days": [52,61,58,55,60,62,65,67,70,69,64,63,66,72,74,73,68,66,71,75,77,76,72,69,68,70,71,73,74,76],
  "deliveries_by_zone": [
    {"zone": "Whitefield", "count": 118},
    {"zone": "Koramangala", "count": 96},
    {"zone": "Indiranagar", "count": 84},
    {"zone": "MG Road", "count": 54},
    {"zone": "Yelahanka", "count": 37}
  ]
}
```

## Steps to Remove Mock Data in UI
1. **Fleet Monitor:** Replace the local array in `FleetMonitor` with `useQuery(['drones'], getDrones)` from `lib/api.ts`, map `current_position.coordinates` to the existing `position` shape for the list.
2. **Deliveries:** Align the `Order` interface to `DeliveryOrderSerializer` (use `customer`, `package`, GeoJSON or lat/lng fields). Fetch with `getOrders()` and drop the hard-coded list.
3. **Analytics pages:** Call backend aggregates once available; until then, hydrate from the “Analytics Rollup” payload above instead of mock literals.
4. **Zones:** Fetch operational and no-fly zones via `getOperationalZones()` / `getNoFlyZones()` and merge into the grid; polygons are GeoJSON.
5. **Realtime:** Add a WebSocket hook for `/ws/tracking/` to stream telemetry into `FleetMonitor` and map positions instead of static coordinates.
6. **Map:** Initialize Cesium in `components/Map3D.tsx`, render drones as entities using live positions, and overlay polygons from the zones endpoints.

## Next Actions
- Seed DB with the sample payloads, then swap each UI page to the corresponding API call.
- Run Timescale/PostGIS extensions and migrate telemetry tables before ingesting flight data.
- Harden auth (token refresh already present; add WS token check) and add basic tests around orders and drones.
- Once live data is wired, delete the mock arrays in the listed files to avoid regressions.
