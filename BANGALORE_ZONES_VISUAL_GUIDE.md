# Bangalore Restricted Zones Map (No-Fly & Warning)

Visual reference for drone no-fly zones (RED) and warning zones (YELLOW) across Bangalore.

---

## 🗺️ Geographic Distribution

```
                          NORTH BANGALORE
    13.5°N ┌─────────────────────────────────────┐
           │                                     │
           │  Yelahanka AF Station (Red)        │
    13.4°N ├─────────────────────────────────────┤
           │  Hebbal Lake (Red)  Indiranagar     │
           │                      Lake (Green)   │
           │                                     │
    13.3°N ├─────────────────────────────────────┤
           │  Cubbon Park     BIAL Airport (Red) │
           │  (Green)         5km zone           │
           │                                     │
    13.2°N ├──────── CENTRAL BANGALORE ──────────┤
           │  CBD (Yellow)                       │
           │  Fort (Red)     Silk Board (Green)  │
           │  Parliament (Red)                   │
           │  Vidhana Soudha (Red)               │
    13.1°N ├─────────────────────────────────────┤
           │  MG Road (Yellow)   HAL (Red)       │
           │                 Whitefield (Yellow) │
           │                                     │
    13.0°N ├────────────────────────────────────┤─EAST
           │  INS Ashoka (Red)   Bellandur (Green)
           │  Mysore Road        Sarjapur        │
    12.9°N │  (Green)            (Yellow)        │
           │                                     │
    12.8°N ├─────────────────────────────────────┤
           │  Electronic City (Green)            │
           │  Tech Park                          │
           │                                     │
    12.7°N ├─────────────────────────────────────┤
           │  Bannerghatta NP (Yellow)           │
           │                                     │
           └─────────────────────────────────────┘
             77.4°E   77.5°E   77.6°E   77.7°E

Legend:
  (Red)    = No-Fly Zone
  (Yellow) = Warning Zone
  (Green)  = Operational Zone
```

---

## 🔴 NO-FLY ZONES (RED) - Detailed Locations

### Military Complexes
```
North East:  Yelahanka Air Force Station (13.1385°N, 77.5988°E) - 3km radius
Northeast:   HAL Aerospace Complex (13.1617°N, 77.7499°E) - 2.5km radius
South:       INS Ashoka Naval Base (13.0456°N, 77.5795°E) - 2km radius

Visual:
        HAL (2.5km) ╱╲
                   ╱  ╲
    Yelahanka    ╱      ╲  Whitefield
    (3km)       ╱────────╲
               ╱ BIAL    ╲
              ╱ (5km)     ╲
             ╱             ╲
            ╱   Central      ╲
           ╱     area        ╲
          ╱   INS Ashoka      ╲
         ╱      (2km)         ╲
```

### Government Buildings
```
Central Downtown (Very High Density):
  • Parliament House (13.1881°N, 77.5917°E) - 1.5km radius
  • Vidhana Soudha (13.1857°N, 77.5902°E) - 1km radius
  • Bangalore Fort (13.1876°N, 77.6244°E) - 0.8km radius

Visual:
        ┌─ Parliament (1.5km) ─┐
        │    ┌─ Fort ─┐        │
        │    │ Vidhana│        │
        │    │ Soudha │        │
        │    └────────┘        │
        └──────────────────────┘
          (Overlapping zones)
```

### Water Bodies
```
North:  Hebbal Lake (13.3778°N, 77.6058°E) - 1.5km radius
Central: Sankey Tank (13.1865°N, 77.5694°E) - 0.8km radius

Visualization:
    ┌─────────────────────┐
    │ Hebbal Lake (1.5km) │
    │  (Cannot operate)   │
    └─────────────────────┘
                ↓
              [City Center]
                ↓
    ┌──────────────────┐
    │ Sankey Tank(0.8km)│
    └──────────────────┘
```

### Airport Restricted Zone
```
East: Bangalore International Airport (13.1939°N, 77.7064°E) - 5km radius

THIS IS THE LARGEST NO-FLY ZONE:

Visual (simplified):
            ╔════════════════════════════════════╗
            ║                                    ║
            ║   BIAL AIRPORT (5 km RADIUS)      ║
            ║                                    ║
            ║   ★ KIA - Kempegowda Intl        ║
            ║                                    ║
            ║   NO DRONES ALLOWED               ║
            ║   AT ANY ALTITUDE                 ║
            ║                                    ║
            ╚════════════════════════════════════╝
```

---

## 🟡 WARNING ZONES (YELLOW) - Caution Areas

### Downtown Commercial
```
CBD - Central Business District (Polygon)
  ┌──────────────────────┐
  │ 13.1926°N, 77.5944°E │ (Dense buildings)
  │ 13.1750°N, 77.6050°E │ (High traffic)
  │                      │ Altitude: 100-3000m
  │ Caution Zone         │
  └──────────────────────┘

MG Road (High Traffic Corridor)
  ├─────────────────────────────┤
  │ 13.1751°N, 77.6053°E        │ Altitude: 150-3000m
  │ Very high pedestrian traffic │
  │ Use extreme caution          │
  └─────────────────────────────┘
```

### IT Corridors (High Buildings)
```
Whitefield Tech Hub (Polygon)
    ┌──────────────┐
    │ Multiple     │ 13.1710°N
    │ Office       │ 77.7250°E
    │ Towers       │
    │ High-rise    │ Altitude: 300-4000m
    │ buildings    │ Must maintain >300m height
    │              │
    └──────────────┘

Bellandur Tech Corridor (Polygon)
    ┌──────────────┐
    │ IT Parks     │ 12.9563°N
    │ Commercial   │ 77.6878°E
    │ Centers      │
    │              │ Altitude: 50-3500m
    └──────────────┘
```

### Residential Areas
```
Koramangala (Polygon)
    ┌──────────────┐
    │ High-density │ 13.0352°N, 77.6245°E
    │ Residential  │
    │ Mixed use    │ Altitude: 200-3500m
    │              │ Sensitive area - caution
    └──────────────┘

Sarjapur Road (Polygon)
    ┌──────────────┐
    │ Developing   │ 12.8900°N, 77.6700°E
    │ Residential  │
    │ Moderate     │ Altitude: 100-3500m
    │ density      │
    └──────────────┘
```

### Ecological Zone
```
Bannerghatta National Park (Circle - 3km radius)
    
    ╔════════════════════════════════════╗
    ║                                    ║
    ║   BANNERGHATTA NATIONAL PARK       ║
    ║   (Polygon: 12.7552°N, 77.6245°E) ║
    ║                                    ║
    ║   Wildlife Conservation Area       ║
    ║   Altitude: 500-3500m             ║
    ║                                    ║
    ║   Limited operations permitted    ║
    ║   High altitude only              ║
    ║                                    ║
    ╚════════════════════════════════════╝
```

---

## 🟢 OPERATIONAL ZONES (GREEN) - Safe Areas

### Recreational Parks
```
Cubbon Park (Circle)                Indiranagar Lake (Circle)
    ┌─────────┐                        ┌─────────┐
    │  Park   │ 13.1878°N              │ Lake    │ 13.3615°N
    │ 77.5945°E                        │ 77.6461°E
    │ 400m    │ Altitude: 10-3500m    │ 500m    │ Altitude: 10-4000m
    │ radius  │                        │ radius  │
    └─────────┘                        └─────────┘
    FREE OPERATIONS                    SCENIC AREA
```

### Industrial & Tech Zones
```
Electronic City (Polygon)            Mysore Road (Polygon)
    ┌────────────┐                    ┌────────────┐
    │ IT Park    │ 12.8565°N          │ Industrial │ 13.0250°N
    │ Industrial │ 77.6760°E          │ Warehouse  │ 77.5700°E
    │ 77.6760°E  │ Alt: 50-4000m      │ 77.5700°E  │ Alt: 50-4000m
    │            │ FULLY OPERATIONAL  │            │ APPROVED ZONE
    └────────────┘                    └────────────┘

Hinjewadi Tech Park (Pune Nearby)   Central Silk Board
    ┌────────────┐                    ┌────────────┐
    │ Tech Park  │ 18.5898°N          │ Industrial │ 13.2231°N
    │ Pune       │ 73.7997°E          │ Silk Ind.  │ 77.4950°E
    │ Nearby     │ Alt: 50-3500m      │ West area  │ Alt: 50-3500m
    │ Expansion  │ OPERATIONAL        │            │ OPERATIONAL
    └────────────┘                    └────────────┘
```

### Hub Areas
```
Majestic Transport Hub (Circle)
    ┌──────────────┐
    │ Major       │ 13.3607°N
    │ Transport   │ 75.3671°E
    │ Hub         │
    │ 300m radius │ Altitude: 50-3000m
    │ Monitored   │ OPERATIONAL
    └──────────────┘
    
Bengaluru Tech Park ORR (Polygon)
    ┌──────────────┐
    │ Outer Ring   │ 13.1100°N, 77.6800°E
    │ Road Tech    │
    │ Corridor     │ Altitude: 50-3500m
    │ 4-point area │ OPERATIONAL
    └──────────────┘
```

---

## 📊 Zone Density Heatmap

```
HIGHEST RESTRICTION DENSITY (Downtown):
    ████████████ (7 zones: 2 no-fly + 3 warning + 2 operational)
    └─ Parliament, Fort, Vidhana Soudha (no-fly)
    └─ CBD, MG Road (warning)
    └─ Cubbon Park, Majestic (operational)

HIGH RESTRICTION (Airport Area):
    ███████ (3 zones: 1 no-fly + 2 operational)
    └─ BIAL Airport (5km no-fly)
    └─ Nearby tech/industrial zones

MEDIUM RESTRICTION (North):
    █████ (3 zones: 2 military no-fly + 1 warning)
    └─ Yelahanka AF, HAL (no-fly)
    └─ Whitefield IT (warning)

MEDIUM RESTRICTION (East):
    █████ (3 zones: 2 operational + 1 warning)
    └─ Bellandur, Sarjapur operational/warning zones

LOW RESTRICTION (South):
    ███ (2 zones: 1 warning + 1 operational)
    └─ Bannerghatta NP warning, Electronic City operational

OPEN AREAS:
    Hebbal Lake region, Indiranagar, outskirts
    Minimal restrictions, maximum operational freedom
```

---

## 🛫 Altitude Profiles by Zone

```
ALTITUDE RESTRICTIONS:

No-Fly Zone Profile:
┌─────────────────────────┐ 5000m (Blocked)
│                         │
│   ████████████████████  │ Completely blocked
│   ████████████████████  │ at all altitudes
│                         │
└─────────────────────────┘ 0m (Ground)

Warning Zone Profile (Example: Whitefield):
┌─────────────────────────┐ 4000m
│                         │
│   ░░░░░░░░░░░░░░░░░░░░  │ Allowed
│                         │
│ 300m ─────────────────── │ Minimum altitude
│       ████████████████  │ Restricted
│       ████████████████  │ (buildings)
│                         │
└─────────────────────────┘ 0m

Operational Zone Profile (Example: Cubbon Park):
┌─────────────────────────┐ 3500m
│                         │
│   ░░░░░░░░░░░░░░░░░░░░  │ Allowed
│                         │
│   ░░░░░░░░░░░░░░░░░░░░  │ Allowed
│                         │
│ 10m ────────────────────│ Minimum altitude
│   ░░░░░░░░░░░░░░░░░░░░  │ Allowed
│                         │
└─────────────────────────┘ 0m (Near ground)
```

---

## 🧭 Navigation Tips for Drone Operations

### Route Planning Around No-Fly Zones

```
Starting Point: Indiranagar
Destination: Electronic City

Path 1 (AVOID - Goes through no-fly zones):
    Indiranagar → [BIAL] → [Whitefield] → Electronic City ✗

Path 2 (SAFE - Avoiding all red zones):
    Indiranagar → Bellandur → Sarjapur → Electronic City ✓

Path 3 (OPTIMAL - Shortest + Safe):
    Indiranagar → Outer Ring Road → Electronic City ✓


Avoiding Downtown No-Fly Zones:
    From West → Go NORTH (Yelahanka) OR SOUTH (Mysore Road)
    From East → Go NORTH (Whitefield) OR SOUTH (Sarjapur)
    From North → GO EAST or WEST, avoid central corridor
```

### Altitude Optimization

```
OPERATION IN YELLOW ZONE:
    Start: Ground level
    Ascend to required altitude (check zone limit)
    Maintain altitude above minimum (e.g., 300m in Whitefield)
    Descend only after leaving zone

Example: MG Road (Yellow):
    Alt: 150-3000m allowed
    Safe cruising: 500m minimum
    Maximum: 3000m

OPERATION IN GREEN ZONE:
    Maximum flexibility: 10m to 3500m+
    Can operate near ground if needed
    Open airspace available
```

---

## 🚨 Violation Alerts

```
AUTOMATIC ALERTS IF:

1. ❌ Entering No-Fly Zone (RED)
   Action: IMMEDIATE DIVERSION REQUIRED
   Altitude: ALL blocked
   Message: "CRITICAL: No-fly zone ahead - divert immediately"

2. ⚠️ Entering Warning Zone (YELLOW)
   Action: ALTITUDE ADJUSTMENT NEEDED
   If altitude < minimum: ASCEND immediately
   If altitude > maximum: DESCEND immediately
   Message: "Caution: Adjust altitude to [range]"

3. ✅ In Operational Zone (GREEN)
   Action: NORMAL OPERATIONS
   Message: "Green zone - operations normal"
```

---

## 📍 Database Structure (zones.json)

Every zone contains:
```json
{
  "id": "unique_id",
  "name": "Zone Name",
  "type": "no-fly|warning|operational",
  "description": "Zone details",
  "shape": "circle|polygon",
  "center": { "lat": 13.xxxx, "lng": 77.xxxx },
  "radius": 5000 (in meters, for circles),
  "polygon": [
    { "lat": 13.xxx, "lng": 77.xxx },
    { "lat": 13.xxx, "lng": 77.xxx }
  ] (for polygons),
  "altitudeRange": {
    "min": 0,
    "max": 5000
  } (in meters),
  "isActive": true
}
```

---

## 🔗 Integration Points

### In Orders Creation
```
1. Customer enters delivery location (lat, lng)
2. System checks: Is this in a no-fly zone?
   → If YES: Order rejected - cannot deliver to restricted area
   → If NO: Continue

3. System checks: Is this in a warning zone?
   → If YES: Alert customer, show altitude restrictions
   → If NO: Continue with normal operation

4. Route planner generates path avoiding all no-fly zones
5. Altitude controller enforces zone altitude limits
```

### In Route Optimization
```
1. Get delivery points
2. Load all no-fly zones (red)
3. Generate routes that avoid no-fly zones
4. Check altitude requirements for warning zones
5. Optimize for minimum distance/time respecting zones
```

### In Fleet Monitoring
```
1. Monitor drone real-time position
2. Check current zone (circle vs polygon)
3. If in no-fly zone: ALERT - violation!
4. If in warning zone: Check altitude compliance
5. Log zone transitions for compliance audit
```

---

## Summary

**24 Zones Total**:
- 🔴 9 No-Fly Zones (Military, Government, Airports, Water)
- 🟡 7 Warning Zones (Commercial, Residential, Parks)
- 🟢 8 Operational Zones (IT Parks, Industrial, Hubs)

**Coverage**: Entire Bangalore metro + nearby regions
**Persistence**: Stored in `/zones.json`, synced to backend
**Retrieval**: Via API with localStorage + fallback
**Enforcement**: Automatic in order creation and route planning
