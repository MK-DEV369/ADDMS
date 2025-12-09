import { useEffect, useRef, useState } from 'react'
import { MapPin, Navigation, Maximize2, Eye, EyeOff, Settings } from 'lucide-react'
import * as Cesium from 'cesium'
Cesium.Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_ION_TOKEN

interface Entity {
  id: string;
  // Add other properties that an entity might have
}

interface Drone {
  id: number
  serialNumber: string
  position: { lat: number; lng: number; altitude: number }
  heading?: number
  pitch?: number
  roll?: number
  status?: 'active' | 'idle' | 'maintenance' | 'emergency' | 'offline'
  battery?: number
}

interface Route {
  id: number
  path: Array<{ lat: number; lng: number; altitude: number }>
  color?: string
  completed?: boolean
}

interface Zone {
  id: number
  name: string
  type: 'operational' | 'no-fly'
  polygon: Array<{ lat: number; lng: number }>
  altitudeRange?: { min: number; max: number }
}

interface Map3DProps {
  drones?: Drone[]
  routes?: Route[]
  zones?: Zone[]
  onDroneClick?: (droneId: number) => void
  onZoneClick?: (zoneId: number) => void
  followDrone?: number | null
  showLabels?: boolean
  showZones?: boolean
  homePosition?: { lat: number; lng: number; altitude: number }
}

export default function Map3D({
  drones = [],
  routes = [],
  zones = [],
  onDroneClick,
  onZoneClick,
  followDrone = null,
  showLabels = true,
  showZones = true,
  homePosition = { lat: 12.9716, lng: 77.5946, altitude: 50000 } // Bangalore
}: Map3DProps): JSX.Element {
  const cesiumContainer = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<Cesium.Viewer | null>(null)
  const entitiesRef = useRef<Map<string, Cesium.Entity>>(new Map())
  
  const [cameraMode, setCameraMode] = useState<'free' | 'follow'>('free')
  const [showBuildings, setShowBuildings] = useState(true)
  const [selectedDrone, setSelectedDrone] = useState<number | null>(null)

  // Initialize Cesium Viewer
  useEffect(() => {
    console.log('🔄 Map3D useEffect triggered - checking initialization conditions')
    console.log('cesiumContainer.current:', !!cesiumContainer.current)
    console.log('viewerRef.current:', !!viewerRef.current)

    if (!cesiumContainer.current || viewerRef.current) {
      console.log('⏭️ Skipping viewer initialization')
      return
    }

    console.log('🚀 Starting viewer initialization')

    const initViewer = async () => {
      console.log('🗺️ Initializing CesiumJS Viewer...')

      try {
        const viewer = new Cesium.Viewer(cesiumContainer.current!, {
          // Terrain
          terrainProvider: await Cesium.createWorldTerrainAsync({
            requestWaterMask: true,
            requestVertexNormals: true
          }),

          // UI
          animation: false,
          timeline: false,
          fullscreenButton: false,
          vrButton: false,
          homeButton: false,
          sceneModePicker: false,
          navigationHelpButton: false,
          geocoder: false,

          // Performance
          requestRenderMode: true,
          maximumRenderTimeChange: Infinity
        })

        console.log('📡 Setting up imagery provider')
        // Set imagery provider
        viewer.imageryLayers.removeAll()
        viewer.imageryLayers.addImageryProvider(
          new Cesium.OpenStreetMapImageryProvider({
            url: 'https://a.tile.openstreetmap.org/'
          })
        )

        console.log('🏢 Adding OSM Buildings')
        // Add OSM Buildings
        const buildingTileset = await Cesium.createOsmBuildingsAsync()
        viewer.scene.primitives.add(buildingTileset)

        console.log('📷 Setting initial camera position')
        // Set initial camera position
        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(
            homePosition.lng,
            homePosition.lat,
            homePosition.altitude
          ),
          orientation: {
            heading: Cesium.Math.toRadians(0),
            pitch: Cesium.Math.toRadians(-45),
            roll: 0
          }
        })

        // Enable lighting
        viewer.scene.globe.enableLighting = true

        console.log('🖱️ Setting up click handler')
        // Click handler
        viewer.screenSpaceEventHandler.setInputAction((movement: any) => {
          const pickedObject = viewer.scene.pick(movement.position)

          if (Cesium.defined(pickedObject) && pickedObject.id) {
            const entity = pickedObject.id

            if (entity.id.startsWith('drone-')) {
              const droneId = parseInt(entity.id.split('-')[1])
              onDroneClick?.(droneId)
            } else if (entity.id.startsWith('zone-')) {
              const zoneId = parseInt(entity.id.split('-')[1])
              onZoneClick?.(zoneId)
            }
          }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

        viewerRef.current = viewer

        console.log('✅ Cesium Viewer initialized successfully')
      } catch (error) {
        console.error('❌ Error initializing Cesium Viewer:', error)
      }
    }

    initViewer()

    return () => {
      console.log('🧹 Cleanup function called')
      if (viewerRef.current) {
        console.log('🧹 Cleaning up Cesium Viewer')
        viewerRef.current.destroy()
        viewerRef.current = null
      }
    }
  }, []) // Remove dependencies to prevent re-initialization

  // Update drone entities
  useEffect(() => {
    if (!viewerRef.current) return

    const viewer = viewerRef.current

    // Remove old drones
    entitiesRef.current.forEach((entity, key) => {
      if (key.startsWith('drone-')) {
        const droneId = parseInt(key.split('-')[1])
        if (!drones.find(d => d.id === droneId)) {
          viewer.entities.remove(entity)
          entitiesRef.current.delete(key)
        }
      }
    })

    // Add/update drones
    drones.forEach(drone => {
      const entityId = `drone-${drone.id}`
      let entity = entitiesRef.current.get(entityId)

      const position = Cesium.Cartesian3.fromDegrees(
        drone.position.lng,
        drone.position.lat,
        drone.position.altitude
      )

      if (entity) {
        // Update existing entity
        entity.position = new Cesium.ConstantPositionProperty(position)

        if (drone.heading !== undefined) {
          entity.orientation = new Cesium.ConstantProperty(
            Cesium.Transforms.headingPitchRollQuaternion(
              position,
              new Cesium.HeadingPitchRoll(
                Cesium.Math.toRadians(drone.heading),
                Cesium.Math.toRadians(drone.pitch || 0),
                Cesium.Math.toRadians(drone.roll || 0)
              )
            )
          )
        }
      } else {
        // Create new entity
        entity = viewer.entities.add({
          id: entityId,
          name: drone.serialNumber,
          position: position,

          // 3D Model (use actual drone GLTF model)
          model: {
            uri: '/models/drone1.glb',
            minimumPixelSize: 64,
            maximumScale: 20000,
            scale: 1.0
          },

          // Or use point for simple visualization
          point: {
            pixelSize: 10,
            color: getStatusColor(drone.status),
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 2,
            heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND
          },

          // Label
          label: showLabels ? {
            text: `${drone.serialNumber}\n${drone.battery}%`,
            font: '12px sans-serif',
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -20),
            heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND
          } : undefined,

          // Description for info box
          description: `
            <div>
              <p><strong>Serial:</strong> ${drone.serialNumber}</p>
              <p><strong>Status:</strong> ${drone.status}</p>
              <p><strong>Battery:</strong> ${drone.battery}%</p>
              <p><strong>Position:</strong> ${drone.position.lat.toFixed(6)}, ${drone.position.lng.toFixed(6)}</p>
              <p><strong>Altitude:</strong> ${drone.position.altitude.toFixed(1)}m</p>
            </div>
          `
        })

        entitiesRef.current.set(entityId, entity)
      }
    })
  }, [drones, showLabels])

  // Update routes
  useEffect(() => {
    if (!viewerRef.current) return

    const viewer = viewerRef.current

    // Remove old routes
    entitiesRef.current.forEach((entity, key) => {
      if (key.startsWith('route-')) {
        const routeId = parseInt(key.split('-')[1])
        if (!routes.find(r => r.id === routeId)) {
          viewer.entities.remove(entity)
          entitiesRef.current.delete(key)
        }
      }
    })

    // Add routes
    routes.forEach(route => {
      const entityId = `route-${route.id}`

      if (!entitiesRef.current.has(entityId)) {
        const positions = route.path.map(p =>
          Cesium.Cartesian3.fromDegrees(p.lng, p.lat, p.altitude)
        )

        const entity = viewer.entities.add({
          id: entityId,
          polyline: {
            positions: positions,
            width: route.completed ? 4 : 2,
            material: route.completed
              ? Cesium.Color.fromCssColorString(route.color || '#00FF00')
              : new Cesium.PolylineDashMaterialProperty({
                  color: Cesium.Color.fromCssColorString(route.color || '#00FFFF'),
                  dashLength: 16.0
                }),
            clampToGround: false,
            arcType: Cesium.ArcType.NONE
          },

          // Waypoint markers
          ...route.path.map((waypoint, index) => ({
            position: Cesium.Cartesian3.fromDegrees(waypoint.lng, waypoint.lat, waypoint.altitude),
            point: {
              pixelSize: 6,
              color: Cesium.Color.YELLOW,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 1
            },
            label: {
              text: `WP${index + 1}`,
              font: '10px sans-serif',
              fillColor: Cesium.Color.YELLOW,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 1,
              pixelOffset: new Cesium.Cartesian2(0, -10),
              show: showLabels
            }
          }))
        })

        entitiesRef.current.set(entityId, entity)
      }
    })
  }, [routes, showLabels])

  // Update zones
  useEffect(() => {
    if (!viewerRef.current || !showZones) return

    const viewer = viewerRef.current

    // Remove old zones
    entitiesRef.current.forEach((entity, key) => {
      if (key.startsWith('zone-')) {
        const zoneId = parseInt(key.split('-')[1])
        if (!zones.find(z => z.id === zoneId)) {
          viewer.entities.remove(entity)
          entitiesRef.current.delete(key)
        }
      }
    })

    // Add zones
    zones.forEach(zone => {
      const entityId = `zone-${zone.id}`

      if (!entitiesRef.current.has(entityId)) {
        const positions = zone.polygon.map(p =>
          Cesium.Cartesian3.fromDegrees(p.lng, p.lat, 0)
        )

        const color = zone.type === 'no-fly'
          ? Cesium.Color.RED.withAlpha(0.3)
          : Cesium.Color.GREEN.withAlpha(0.3)

        const entity = viewer.entities.add({
          id: entityId,
          name: zone.name,
          polygon: {
            hierarchy: new Cesium.PolygonHierarchy(positions),
            material: color,
            outline: true,
            outlineColor: color.withAlpha(1.0),
            outlineWidth: 2,
            height: zone.altitudeRange?.min || 0,
            extrudedHeight: zone.altitudeRange?.max || 500,
            perPositionHeight: false
          },
          label: {
            text: zone.name,
            font: '14px sans-serif',
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            pixelOffset: new Cesium.Cartesian2(0, 0),
            show: showLabels
          }
        })

        entitiesRef.current.set(entityId, entity)
      }
    })
  }, [zones, showZones, showLabels])

  // Camera follow mode
  useEffect(() => {
    if (!viewerRef.current || !followDrone) return

    const viewer = viewerRef.current
    const entity = entitiesRef.current.get(`drone-${followDrone}`)

    if (entity) {
      viewer.trackedEntity = entity
    }
  }, [followDrone])

  // Handle drone click
  // const handleDroneClick = (droneId: number) => {
  //   setSelectedDrone(droneId)
  //   if (onDroneClick) {
  //     onDroneClick(droneId)
  //   }
  // }

  // Camera controls
  const handleFitToView = () => {
    console.log('📷 Fitting all entities to view')
    // In production: viewerRef.current.zoomTo(viewerRef.current.entities)
  }

  const handleResetCamera = () => {
    console.log('📷 Resetting camera to home position')
    setCameraMode('free')
    setSelectedDrone(null)
    // In production: viewerRef.current.camera.flyHome()
  }

  const toggleBuildings = () => {
    setShowBuildings(!showBuildings)
    console.log(`🏢 Buildings: ${!showBuildings ? 'shown' : 'hidden'}`)
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return Cesium.Color.GREEN
      case 'idle': return Cesium.Color.YELLOW
      case 'maintenance': return Cesium.Color.ORANGE
      case 'emergency': return Cesium.Color.RED
      default: return Cesium.Color.BLUE
    }
  }

  const getBatteryColor = (battery?: number) => {
    if (!battery) return 'text-gray-400'
    if (battery > 50) return 'text-green-500'
    if (battery > 20) return 'text-yellow-500'
    return 'text-red-500'
  }

  return (
    <div className="relative w-full h-full min-h-[600px]">
      {/* Cesium Container */}
      <div
        ref={cesiumContainer}
        className="w-full h-full bg-gray-900"
      />

      {/* Control Panel */}
      <div className="absolute top-4 right-4 space-y-2">
        <button
          onClick={handleFitToView}
          className="bg-gray-900 bg-opacity-80 text-white p-2 rounded hover:bg-opacity-100 transition-all"
          title="Fit to view"
        >
          <Maximize2 className="h-5 w-5" />
        </button>
        
        <button
          onClick={handleResetCamera}
          className="bg-gray-900 bg-opacity-80 text-white p-2 rounded hover:bg-opacity-100 transition-all"
          title="Reset camera"
        >
          <Navigation className="h-5 w-5" />
        </button>
        
        <button
          onClick={toggleBuildings}
          className="bg-gray-900 bg-opacity-80 text-white p-2 rounded hover:bg-opacity-100 transition-all"
          title={showBuildings ? 'Hide buildings' : 'Show buildings'}
        >
          {showBuildings ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-gray-900 bg-opacity-80 text-white p-3 rounded space-y-2 text-sm">
        <div className="font-semibold mb-2">Legend</div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span>Active</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span>Idle</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500"></div>
          <span>Maintenance</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span>Emergency</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-500"></div>
          <span>Offline</span>
        </div>
      </div>

      {/* Camera Mode Indicator */}
      {cameraMode === 'follow' && selectedDrone && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg">
          <div className="flex items-center gap-2">
            <Navigation className="h-4 w-4 animate-pulse" />
            <span className="font-semibold">
              Following {drones.find(d => d.id === selectedDrone)?.serialNumber}
            </span>
          </div>
        </div>
      )}

      {/* Stats Overlay */}
      <div className="absolute top-4 left-4 bg-gray-900 bg-opacity-80 text-white p-3 rounded space-y-1 text-sm">
        <div className="font-semibold mb-2">Map Stats</div>
        <div>Active Drones: <span className="text-green-400">{drones.filter(d => d.status === 'active').length}</span></div>
        <div>Routes: <span className="text-cyan-400">{routes.length}</span></div>
        <div>Zones: <span className="text-yellow-400">{zones.length}</span></div>
        <div>Buildings: <span className={showBuildings ? 'text-green-400' : 'text-gray-400'}>{showBuildings ? 'Shown' : 'Hidden'}</span></div>
      </div>
    </div>
  )
}