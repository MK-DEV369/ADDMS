# Delivery ETA/Cost/Route Integration - Next Steps

This README captures concrete follow-ups to harden ETA, cost, and route visibility across roles, plus telemetry, pricing, and analytics improvements.

## Backend
- **Expose route preview**: DeliveryOrderSerializer now returns `route_summary` and full `route` when present. Use the new `/deliveries/orders/{id}/route/` action for previews.
- **API shape**: Orders include `estimated_eta`, `estimated_duration_minutes`, `total_cost`, and `route_summary` (distance_km, duration, ETA, waypoint_count). Route endpoints expose GeoJSON via `path_geojson`.
- **Cost model**: Current formula = base ₹50 + (distance_km * max(weight, 0.5kg) * ₹10). Consider priority surcharge (e.g., +20% for express) and caps.
- **Health check**: Add a `/health/worker` endpoint that pings Celery/Redis and logs to SystemLog for visibility.
- **Telemetry-driven ETA**: Recompute ETA on telemetry events (distance remaining) and push to Channels for live UI updates.

## Frontend
- **Customer Orders**: Shows server ETA/duration/cost and route distance/waypoints when available; uses fallback estimate only before creation. Keep “View details” to open the order page/route.
- **Manager/Admin tables**: Ensure deliveries tables surface ETA, duration, cost, and, where possible, route distance/waypoint counts. Add “View route” modal using `/deliveries/orders/{id}/route/`.
- **Analytics**: Marked as simulated. Swap to live metrics once ETL/telemetry is ready; hide or keep the badge until then.

## Data/Maps
- **Coordinate systems**: Google Maps and OSM both use WGS84 (EPSG:4326). Keep GeoJSON order as [lng, lat] and SRID 4326. Minor visual offsets stem from differing basemaps/buildings, not projection; no extra normalization is needed.

## Testing
- `python manage.py migrate` (done) then start API + Celery + Redis.
- Create an order as customer; confirm response includes ETA/duration/cost and that Orders table shows them.
- Assign/optimize to generate a route; GET `/deliveries/orders/{id}/route/` and verify GeoJSON/waypoints and route_summary on the order payload.
- Open customer Tracking/Overview and manager Deliveries/FleetMonitor to confirm ETA/cost render; if route preview is added, verify the polyline/waypoints modal.

## Improvements backlog
- Priority surcharge and caps; expose configurable pricing in settings.
- Request-id propagation in SystemLog for routes/telemetry.
- ETA uncertainty band (from ETAPredictor confidence) in UI.
- Retry/backoff for telemetry ingest and route optimizations.
- Replace simulated analytics with real aggregations (counts, avg ETA, avg cost) and label confidence.
