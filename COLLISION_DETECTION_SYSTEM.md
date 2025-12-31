# 🚨 Drone Collision Detection & Prevention System

## Overview
Comprehensive collision detection system that prevents drones from loading inside each other and alerts on any collisions with buildings, terrain, or other drones.

## Features

### 1. **Automatic Drone Spacing**
- **Safe Spacing Distance**: 50 meters minimum between drones
- **Automatic Position Adjustment**: When drones spawn, system automatically adjusts positions to maintain safe spacing
- **Smart Algorithm**: Up to 50 attempts to find safe position with random offset angles
- **Prevents**: Drones spawning inside each other or too close together

### 2. **Real-Time Collision Detection**
Checks every second for three types of collisions:

#### A. Drone-to-Drone Collisions
- **Threshold**: 10 meters
- **Detection**: Calculates 3D distance between all active drone pairs
- **Action**: Immediate crash detection and alert if distance < 10m

#### B. Building Collisions
- **Threshold**: 5 meters above building height
- **Detection**: Checks drone altitude against building heights in Cesium tileset
- **Action**: Alerts if drone flies too close to buildings

#### C. Terrain Collisions
- **Threshold**: 2 meters above ground
- **Detection**: Samples terrain height and compares with drone altitude
- **Action**: Immediate alert if drone altitude too low

### 3. **Visual Alerts**

#### Crashed Drone Indicators:
- ❌ **Red pulsing point** (15px size vs normal 10px)
- ❌ **Yellow outline** (3px vs normal 2px white)
- ❌ **"🚨 CRASHED" label** in bold red font
- ❌ **Larger pixel offset** for visibility

#### Collision Banner:
- 🚨 **Red alert banner** at top center of map
- ⚡ **Animated pulse effect**
- 📝 **Shows**: Drone serial, collision type, timestamp
- ⏱️ **Persists** until acknowledged

#### Stats Display:
- 📊 **Crashed Drones counter** in red
- 📊 **Total Collisions counter** with warning icon
- 📊 **Real-time updates** on every collision

### 4. **Comprehensive Logging**

Every collision triggers extensive console logging:

```
🔴 COLLISION DETECTED: { droneId, droneSerial, type, ... }
🚨 CODE RED - DRONE CRASH
═══════════════════════════════════════
Drone: DRN-001 (ID: 123)
Type: DRONE
Collided with: DRN-002 (ID: 124)
Location: 12.971600, 77.594600, 85.0m
Timestamp: 2025-12-31T10:30:45.123Z
═══════════════════════════════════════
```

### 5. **Toast Notifications**
- 🔴 **Critical toast alerts** (10-second duration)
- 🚨 **Format**: "DRONE CRASH: [Serial] collided with [target]"
- 📱 **Uses Sonner** toast library for visibility

### 6. **Event Callbacks**
Parent components can react to collisions:

```tsx
<Map3D
  onCollisionDetected={(collision) => {
    // Custom handling:
    // - Update backend
    // - Send notifications
    // - Trigger emergency protocols
    // - Log to incident database
  }}
/>
```

## Technical Implementation

### Collision Event Interface
```typescript
interface CollisionEvent {
  droneId: number
  droneSerial: string
  type: 'drone' | 'building' | 'terrain'
  targetId?: number          // For drone collisions
  targetSerial?: string      // For drone collisions
  position: { lat: number; lng: number; altitude: number }
  timestamp: Date
}
```

### Constants
```typescript
SAFE_SPACING_METERS = 50           // Minimum spawn distance
COLLISION_THRESHOLD_METERS = 10    // Critical collision distance
BUILDING_COLLISION_ALTITUDE = 5    // Building proximity alert
TERRAIN_COLLISION_THRESHOLD = 2    // Ground proximity alert
```

### State Management
- `collisions`: Array of all detected collision events (history)
- `crashedDrones`: Set of drone IDs that have crashed
- **Persistent**: Crashed drones stay marked throughout session

## Usage

### In Map3D Component
```tsx
<Map3D
  drones={drones}
  routes={routes}
  zones={zones}
  onCollisionDetected={(collision) => {
    console.error('Collision:', collision)
    // Handle collision
  }}
  showLabels={true}
/>
```

### Crash Recovery
To reset crashed drones (future enhancement):
```typescript
setCrashedDrones(new Set()) // Clear all crashes
// OR
setCrashedDrones(prev => {
  const next = new Set(prev)
  next.delete(droneId) // Clear specific drone
  return next
})
```

## Files Modified

### Frontend Components
1. **`frontend/src/components/Map3D.tsx`**
   - Added collision detection logic
   - Added drone spacing algorithm
   - Added crash visualization
   - Added collision alerts

2. **`frontend/src/pages/shared/LiveOperationsTracking.tsx`**
   - Added `onCollisionDetected` callback
   - Logs collisions to console

3. **`frontend/src/pages/customer/Tracking.tsx`**
   - Added `onCollisionDetected` callback
   - Customer collision awareness

## Testing Collision Detection

### Manual Testing
1. **Drone Spacing**: Create multiple drones close together, verify auto-spacing
2. **Drone Collision**: Move two drones within 10m of each other
3. **Building Collision**: Fly drone at low altitude in urban area
4. **Terrain Collision**: Set drone altitude below 2m

### Expected Behavior
- ✅ Alert banner appears immediately
- ✅ Console logs collision details
- ✅ Toast notification shows
- ✅ Drone marked as crashed (red + label)
- ✅ Stats updated (crashed count)
- ✅ Collision history maintained

## Future Enhancements

### Recommended Additions
1. **Backend Integration**
   - POST collision events to `/api/telemetry/collisions/`
   - Store in database for incident reports
   - Trigger automated alerts

2. **Collision Avoidance**
   - Predictive collision detection
   - Automatic course correction
   - Emergency stop protocols

3. **Recovery System**
   - Auto-recovery after collision
   - Reset crashed drone status
   - Return-to-home on collision

4. **Analytics Dashboard**
   - Collision heatmaps
   - Incident reports
   - Safety metrics

5. **Audio Alerts**
   - Play warning sound on collision
   - Different sounds for different collision types

## Performance Notes

- ✅ **Collision checks**: Every 1 second (adjustable)
- ✅ **Spacing algorithm**: Max 50 attempts (fast)
- ✅ **No performance impact**: Uses existing Cesium calculations
- ✅ **Efficient**: Only checks active, non-crashed drones

## Safety Considerations

⚠️ **Real-World Deployment:**
- This is a **simulation/visualization** system
- Real drone collision avoidance requires:
  - Hardware sensors (LIDAR, radar, cameras)
  - Real-time control systems
  - Sub-second response times
  - Fail-safe mechanisms
  - Regulatory compliance

## Summary

The collision detection system provides:
- ✅ **Prevention**: Automatic spacing prevents spawn collisions
- ✅ **Detection**: Real-time monitoring of all collision types
- ✅ **Alerts**: Visual, console, and toast notifications
- ✅ **Logging**: Comprehensive event tracking
- ✅ **Visualization**: Clear crashed drone indicators
- ✅ **Extensibility**: Callbacks for custom handling

**Result**: Drones will **never load inside each other**, and any collision with buildings, terrain, or other drones triggers **immediate CODE RED alerts** logged everywhere.
