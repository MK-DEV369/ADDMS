import { useState, useEffect } from 'react'
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Eye,
  CheckCircle,
  AlertTriangle,
  Settings
} from 'lucide-react'
import { Zone } from '@/lib/types'

export default function Zones() {
  const [zones, setZones] = useState<Zone[]>([])
  const [loading, setLoading] = useState(true)

  // Mock data - replace with real API call
  useEffect(() => {
    const mockZones: Zone[] = [
      {
        id: 1,
        name: 'Downtown Delivery Zone',
        type: 'operational',
        description: 'Primary delivery area for urban deliveries',
        altitudeRange: { min: 30, max: 100 },
        polygon: [
          { lat: 12.9716, lng: 77.5946 },
          { lat: 12.9816, lng: 77.5946 },
          { lat: 12.9816, lng: 77.6046 },
          { lat: 12.9716, lng: 77.6046 }
        ],
        isActive: true
      },
      {
        id: 2,
        name: 'Airport No-Fly Zone',
        type: 'no-fly',
        description: 'Restricted airspace around airport',
        altitudeRange: { min: 0, max: 500 },
        polygon: [
          { lat: 13.0827, lng: 80.2707 },
          { lat: 13.0927, lng: 80.2707 },
          { lat: 13.0927, lng: 80.2807 },
          { lat: 13.0827, lng: 80.2807 }
        ],
        isActive: true
      },
      {
        id: 3,
        name: 'Residential Area',
        type: 'operational',
        description: 'Low-altitude residential delivery zone',
        altitudeRange: { min: 20, max: 80 },
        polygon: [
          { lat: 12.9516, lng: 77.5746 },
          { lat: 12.9616, lng: 77.5746 },
          { lat: 12.9616, lng: 77.5846 },
          { lat: 12.9516, lng: 77.5846 }
        ],
        isActive: true
      }
    ]

    setTimeout(() => {
      setZones(mockZones)
      setLoading(false)
    }, 1000)
  }, [])

  const getZoneTypeColor = (type: string) => {
    switch (type) {
      case 'operational': return 'bg-green-100 text-green-800'
      case 'no-fly': return 'bg-red-100 text-red-800'
      case 'warning': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getZoneTypeIcon = (type: string) => {
    switch (type) {
      case 'operational': return <CheckCircle className="w-4 h-4" />
      case 'no-fly': return <AlertTriangle className="w-4 h-4" />
      case 'warning': return <AlertTriangle className="w-4 h-4" />
      default: return <MapPin className="w-4 h-4" />
    }
  }

  const operationalZones = zones.filter(z => z.type === 'operational').length
  const noFlyZones = zones.filter(z => z.type === 'no-fly').length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          <span>Add Zone</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Zones</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{zones.length}</p>
            </div>
            <MapPin className="w-10 h-10 text-blue-500" />
          </div>
          <p className="text-xs text-gray-600 mt-2">Configured zones</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Operational</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{operationalZones}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <p className="text-xs text-gray-600 mt-2">Active delivery zones</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">No-fly</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{noFlyZones}</p>
            </div>
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          <p className="text-xs text-gray-600 mt-2">No-fly zones</p>
        </div>
      </div>

      {/* Zones List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Zone Configuration</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {zones.map((zone) => (
              <div key={zone.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {getZoneTypeIcon(zone.type)}
                    <div>
                      <h3 className="font-medium">{zone.name}</h3>
                      <p className="text-sm text-gray-600">{zone.description}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getZoneTypeColor(zone.type)}`}>
                    {zone.type}
                  </span>

                  <div className="text-sm text-gray-600">
                    Altitude: {zone.altitudeRange?.min}-{zone.altitudeRange?.max}m
                  </div>

                  <div className="flex items-center space-x-2">
                    <button className="p-1 text-gray-400 hover:text-gray-600">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-gray-600">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
