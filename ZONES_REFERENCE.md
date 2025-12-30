# Bangalore Zones Reference Guide

Quick reference for all 24 zones configured in the ADDMS system.

---

## 🔴 NO-FLY ZONES (Red) - 9 Zones

| # | Zone Name | Location | Radius | Type |
|---|-----------|----------|--------|------|
| 1 | Bangalore International Airport (BIAL) | 13.1939°N, 77.7064°E | 5 km | Airport |
| 2 | HAL Aerospace Complex | 13.1617°N, 77.7499°E | 2.5 km | Military |
| 3 | INS Ashoka Naval Base | 13.0456°N, 77.5795°E | 2 km | Military |
| 4 | Yelahanka Air Force Station | 13.1385°N, 77.5988°E | 3 km | Military |
| 5 | Parliament House Area | 13.1881°N, 77.5917°E | 1.5 km | Government |
| 6 | Vidhana Soudha Complex | 13.1857°N, 77.5902°E | 1 km | Government |
| 7 | Bangalore Fort Area | 13.1876°N, 77.6244°E | 0.8 km | Heritage |
| 8 | Hebbal Lake | 13.3778°N, 77.6058°E | 1.5 km | Water |
| 9 | Sankey Tank | 13.1865°N, 77.5694°E | 0.8 km | Water |

---

## 🟡 WARNING ZONES (Yellow) - 7 Zones

| # | Zone Name | Area Type | Altitude Limit | Coverage |
|---|-----------|-----------|----------------|----------|
| 1 | Central Business District | Commercial | 100-3000m | Downtown polygon |
| 2 | Whitefield IT Hub | Tech Corridor | 300-4000m | Polygon (5 points) |
| 3 | Koramangala Residential | Residential | 200-3500m | Polygon (4 points) |
| 4 | MG Road Commercial | Commercial | 150-3000m | Polygon (4 points) |
| 5 | Bannerghatta National Park | Ecological | 500-3500m | 3 km radius |
| 6 | Sarjapur Road Residential | Residential | 100-3500m | Polygon (4 points) |

---

## 🟢 OPERATIONAL ZONES (Green) - 9 Zones

| # | Zone Name | Location | Max Altitude | Type |
|---|-----------|----------|--------------|------|
| 1 | Indiranagar Lake | 13.3615°N, 77.6461°E | 4000m | Park |
| 2 | Cubbon Park | 13.1878°N, 77.5945°E | 3500m | Park |
| 3 | Majestic Transport Hub | 13.3607°N, 75.3671°E | 3000m | Hub |
| 4 | Electronic City IT Park | 12.8565°N, 77.6760°E | 4000m | Industrial |
| 5 | Mysore Road Industrial | 13.0250°N, 77.5700°E | 4000m | Industrial |
| 6 | Hinjewadi Tech Park (Pune) | 18.5898°N, 73.7997°E | 3500m | Tech |
| 7 | Bengaluru Tech Park ORR | 13.1100°N, 77.6800°E | 3500m | Tech |
| 8 | Central Silk Board Area | 13.2231°N, 77.4950°E | 3500m | Industrial |
| 9 | Bellandur Tech Corridor | 12.9563°N, 77.6878°E | 3500m | Tech |

---

## 📊 Zone Statistics

```
Total Zones: 24
├── No-Fly Zones: 9 (37.5%)
│   ├── Military: 4
│   ├── Government: 2
│   ├── Heritage: 1
│   └── Water: 2
├── Warning Zones: 7 (29.2%)
│   ├── Commercial: 2
│   ├── Residential: 2
│   ├── Ecological: 1
│   └── Tech Corridor: 2
└── Operational Zones: 8 (33.3%)
    ├── Park/Recreational: 2
    ├── Transport: 1
    ├── Industrial: 2
    ├── Tech Parks: 4
    └── Regional: 1
```

---

## 🗺️ Geographic Zones

### North Zone (Yelahanka, Whitefield)
- Yelahanka Air Force Station (No-Fly)
- HAL Aerospace Complex (No-Fly)
- Whitefield IT Hub (Warning)
- Bengaluru Tech Park ORR (Operational)

### Central Zone (Downtown, MG Road, Fort)
- Bangalore Fort (No-Fly)
- Parliament House (No-Fly)
- Vidhana Soudha (No-Fly)
- Central Business District (Warning)
- MG Road Commercial (Warning)
- Cubbon Park (Operational)

### East Zone (Bellandur, Sarjapur)
- Bellandur Tech Corridor (Operational)
- Sarjapur Road (Warning)
- Hebbal Lake (No-Fly)

### South Zone (Bannerghatta, Electronic City)
- Bannerghatta National Park (Warning)
- Electronic City IT Park (Operational)
- INS Ashoka Naval Base (No-Fly)

### West Zone (Mysore Road, Silk Board)
- Mysore Road Industrial (Operational)
- Central Silk Board Area (Operational)

### North-East Zone (Indiranagar)
- Indiranagar Lake (Operational)
- Majestic Transport Hub (Operational)

### Airport Zone
- Bangalore International Airport (No-Fly)
- Sankey Tank (No-Fly)

---

## 🛫 Altitude Restrictions

### No-Fly Zones
- **All altitudes blocked** (0-5000m)
- No exceptions for any type of operation

### Warning Zones
- **Minimum altitude**: 100-500m (depends on zone)
- **Maximum altitude**: 3000-4000m
- Requires caution and monitoring

### Operational Zones
- **Minimum altitude**: 10-50m (near ground)
- **Maximum altitude**: 3500-4000m
- Open for standard delivery operations

---

## 🌐 Data Format

### Zone Object Structure
```json
{
  "id": 1,
  "name": "Zone Name",
  "type": "operational|warning|no-fly",
  "description": "Description of zone",
  "shape": "circle|polygon",
  "center": {
    "lat": 13.1939,
    "lng": 77.7064
  },
  "radius": 5000,
  "polygon": [
    { "lat": 13.1926, "lng": 77.5944 },
    { "lat": 13.1900, "lng": 77.6100 }
  ],
  "altitudeRange": {
    "min": 0,
    "max": 5000
  },
  "isActive": true
}
```

### Handling in Code
```typescript
// Retrieve from API or localStorage
const zones = await getZones()

// Filter by type
const noFlyZones = zones.filter(z => z.type === 'no-fly')
const operationalZones = zones.filter(z => z.type === 'operational')

// Check if point is in zone
function isInZone(lat: number, lng: number, zone: Zone): boolean {
  if (zone.shape === 'circle') {
    const distance = calculateDistance(
      zone.center.lat, zone.center.lng,
      lat, lng
    )
    return distance * 1000 <= zone.radius // Convert km to meters
  }
  
  if (zone.shape === 'polygon') {
    // Use point-in-polygon algorithm
    return pointInPolygon([lng, lat], zone.polygon)
  }
  
  return false
}

// Check altitude compliance
function isAltitudeAllowed(zone: Zone, altitude: number): boolean {
  return altitude >= zone.altitudeRange.min && 
         altitude <= zone.altitudeRange.max
}
```

---

## 🔧 Maintenance & Updates

### Adding New Zones
1. Open Zones page → Click "Add Zone"
2. Fill form (name, type, shape, coordinates)
3. Save → Syncs to backend API

### Updating Existing Zones
1. Click Edit (pencil icon) on zone
2. Modify fields as needed
3. Save → Updates backend via PATCH

### Removing Zones
1. Click Delete (trash icon)
2. Confirm deletion
3. Zone removed from API and localStorage

### Exporting Zones
- **JSON**: Full zone objects, preserves all data
- **CSV**: Tabular format, useful for spreadsheets
- Both include polygon coordinates

### Importing Zones
- Accepts JSON or CSV files
- Automatically syncs to backend
- Shows warnings for failed syncs
- Preserves local zones if import fails

---

## 📍 Real-World Application

### Delivery Operations
1. Customer places order with delivery location
2. System checks if location is in no-fly zone
3. If in warning zone, suggests higher altitude
4. If in operational zone, confirms delivery possible
5. Route planner avoids no-fly zones
6. Altitude controller respects zone limits

### Fleet Monitoring
1. Manager views drone positions on map
2. System highlights zone boundaries
3. Alerts if drone enters no-fly zone
4. Warns if altitude exceeds zone limit
5. Logs zone transitions for compliance

### Compliance Reporting
1. Export zones as audit trail
2. Track zone modifications (created/updated/deleted)
3. Document regulatory compliance
4. Generate zone coverage maps

---

## 🌍 Future Enhancements

1. **Dynamic Zone Updates**
   - Integrate with government no-fly zone databases
   - Auto-update restricted areas
   - Real-time restriction changes

2. **Weather Integration**
   - Overlay weather zones
   - Restrict operations in bad weather areas
   - Dynamic altitude limits based on conditions

3. **Traffic-Based Zones**
   - Create zones during peak traffic hours
   - Restrict operations in congested areas
   - Time-based zone activation

4. **Visualization Improvements**
   - 3D zone visualization on map
   - Zone heatmaps showing activity
   - Real-time zone boundary highlighting

5. **Machine Learning**
   - Suggest optimal routes avoiding zones
   - Predict zone violations before they occur
   - Auto-generate zones from delivery patterns
