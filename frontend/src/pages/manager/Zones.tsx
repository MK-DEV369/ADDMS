import { useEffect, useRef, useState } from 'react'
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Eye,
  CheckCircle,
  AlertTriangle,
  Upload,
  Download,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { Zone } from '@/lib/types'
import api from '@/lib/api'

export default function Zones() {
  const [zones, setZones] = useState<Zone[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Zone | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Fetch zones from API with fallback to localStorage then public file
  const fetchZones = async () => {
    try {
      setError(null)
      const res = await api.get('/zones/zones/')
      const data = res.data.results || res.data
      const zonesData = Array.isArray(data) ? data : []
      setZones(zonesData)
      localStorage.setItem('zones', JSON.stringify(zonesData))
      console.debug('Fetched zones from API:', zonesData)
    } catch (err: any) {
      console.error('Failed to fetch zones from API', err)
      
      // Fallback to localStorage
      const stored = localStorage.getItem('zones')
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          setZones(parsed)
          console.debug('Loaded zones from localStorage')
          return
        } catch (e) {
          console.error('Failed to parse localStorage zones', e)
        }
      }

      // Fallback to public zones.json file
      try {
        const res = await fetch('/zones.json')
        const data = await res.json()
        setZones(data)
        localStorage.setItem('zones', JSON.stringify(data))
        console.debug('Loaded zones from public file')
      } catch (fileErr) {
        console.error('Failed to load zones from public file', fileErr)
        setError('Failed to load zones. Please try again or upload a file.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchZones()
  }, [])

  useEffect(() => {
    if (!loading) {
      localStorage.setItem('zones', JSON.stringify(zones))
    }
  }, [zones, loading])

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
  const warningZones = zones.filter(z => z.type === 'warning').length

  const upsertZone = async (z: Zone) => {
    try {
      if (z.id) {
        // Update existing zone
        await api.patch(`/zones/zones/${z.id}/`, z)
      } else {
        // Create new zone
        await api.post('/zones/zones/', z)
      }
      
      // Refresh zones from API
      await fetchZones()
      setShowModal(false)
      setEditing(null)
    } catch (err: any) {
      console.error('Failed to save zone', err)
      alert(`Failed to save zone: ${err?.response?.data?.detail || err.message}`)
    }
  }

  const removeZone = async (id?: number) => {
    if (!id) return
    if (!window.confirm('Delete this zone?')) return
    
    try {
      await api.delete(`/zones/zones/${id}/`)
      await fetchZones()
    } catch (err: any) {
      console.error('Failed to delete zone', err)
      alert(`Failed to delete zone: ${err?.response?.data?.detail || err.message}`)
    }
  }

  const downloadBlob = (content: string, name: string, type: string) => {
    const a = document.createElement('a')
    const file = new Blob([content], { type })
    a.href = URL.createObjectURL(file)
    a.download = name
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const exportJSON = () => downloadBlob(JSON.stringify(zones, null, 2), 'zones.json', 'application/json')

  const exportCSV = () => {
    const header = ['id','name','type','shape','lat','lng','radius','description','altitude_min','altitude_max','polygon'].join(',')
    const lines = zones.map(z => {
      const lat = z.center?.lat ?? ''
      const lng = z.center?.lng ?? ''
      const radius = z.radius ?? ''
      const poly = (z.polygon || []).map(p => `${p.lat}:${p.lng}`).join(';')
      const min = z.altitudeRange?.min ?? ''
      const max = z.altitudeRange?.max ?? ''
      return [z.id ?? '', escapeCsv(z.name), z.type, z.shape ?? (z.center ? 'circle' : 'polygon'), lat, lng, radius, escapeCsv(z.description || ''), min, max, poly].join(',')
    })
    downloadBlob([header, ...lines].join('\n'), 'zones.csv', 'text/csv')
  }

  const escapeCsv = (val: string) => {
    if (val.includes(',') || val.includes('"') || val.includes('\n')) return `"${val.replace(/"/g, '""')}"`
    return val
  }

  const importFile = async (file: File) => {
    try {
      const text = await file.text()
      if (file.name.endsWith('.json')) {
        const imported = JSON.parse(text)
        // Sync imported zones to backend
        for (const zone of imported) {
          try {
            if (zone.id) {
              await api.patch(`/zones/zones/${zone.id}/`, zone)
            } else {
              await api.post('/zones/zones/', zone)
            }
          } catch (e) {
            console.warn('Failed to sync zone:', zone.name, e)
          }
        }
        await fetchZones()
        return
      }
      if (file.name.endsWith('.csv')) {
        const rows = text.split(/\r?\n/).filter(Boolean)
        const data = rows.slice(1)
        const out: Zone[] = []
        data.forEach(line => {
          const cols = parseCsvLine(line)
          const [id, name, type, shape, lat, lng, radius, description, min, max, poly] = cols
          const zone: Zone = {
            id: id ? Number(id) : undefined,
            name,
            type: (type as any) || 'operational',
            description,
            shape: (shape as any) || 'polygon',
            center: lat && lng ? { lat: Number(lat), lng: Number(lng) } : undefined,
            radius: radius ? Number(radius) : undefined,
            polygon: poly ? poly.split(';').map(p => { const [la, ln] = p.split(':'); return { lat: Number(la), lng: Number(ln) } }) : [],
            altitudeRange: (min || max) ? { min: Number(min || 0), max: max ? Number(max) : undefined } : undefined,
            isActive: true,
          }
          out.push(zone)
        })
        
        // Sync imported zones to backend
        for (const zone of out) {
          try {
            if (zone.id) {
              await api.patch(`/zones/zones/${zone.id}/`, zone)
            } else {
              await api.post('/zones/zones/', zone)
            }
          } catch (e) {
            console.warn('Failed to sync zone:', zone.name, e)
          }
        }
        await fetchZones()
      }
    } catch (err: any) {
      console.error('Failed to import file', err)
      alert(`Failed to import file: ${err.message}`)
    }
  }

  const parseCsvLine = (line: string): string[] => {
    const result: string[] = []
    let cur = ''
    let inQ = false
    for (let i = 0; i < line.length; i++) {
      const c = line[i]
      if (inQ) {
        if (c === '"' && line[i+1] === '"') { cur += '"'; i++; continue }
        if (c === '"') { inQ = false; continue }
        cur += c
        continue
      }
      if (c === '"') { inQ = true; continue }
      if (c === ',') { result.push(cur); cur = ''; continue }
      cur += c
    }
    result.push(cur)
    return result
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
          <button
            onClick={() => {
              setLoading(true)
              fetchZones()
            }}
            className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-800 rounded transition-colors"
          >
            Retry
          </button>
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setEditing({ name: '', type: 'operational', polygon: [], shape: 'circle', center: { lat: 12.9716, lng: 77.5946 }, radius: 1000, isActive: true }); setShowModal(true) }}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
          <Plus className="w-4 h-4" />
          <span>Add Zone</span>
          </button>
          <button onClick={exportJSON} className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded hover:bg-gray-200">
            <Download className="w-4 h-4" /> JSON
          </button>
          <button onClick={exportCSV} className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded hover:bg-gray-200">
            <Download className="w-4 h-4" /> CSV
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded hover:bg-gray-200">
            <Upload className="w-4 h-4" /> Import
          </button>
          <input ref={fileInputRef} type="file" accept=".json,.csv" className="hidden" onChange={(e) => {
            const f = e.target.files?.[0]; if (f) importFile(f)
            e.currentTarget.value = ''
          }} />
        </div>
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
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Yellow (Warning)</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{warningZones}</p>
            </div>
            <AlertTriangle className="w-10 h-10 text-yellow-500" />
          </div>
          <p className="text-xs text-gray-600 mt-2">Caution areas</p>
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
                      <p className="text-xs text-gray-500">{zone.shape === 'circle' && zone.center ? `Circle @ ${zone.center.lat.toFixed(4)}, ${zone.center.lng.toFixed(4)} • r=${zone.radius}m` : `Polygon with ${zone.polygon?.length || 0} points`}</p>
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
                    <button onClick={() => { setEditing(zone); setShowModal(true) }} className="p-1 text-gray-400 hover:text-gray-600">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => { setEditing(zone); setShowModal(true) }} className="p-1 text-gray-400 hover:text-gray-600">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => removeZone(zone.id)} className="p-1 text-gray-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="text-lg font-semibold">{editing.id ? 'Edit Zone' : 'Add Zone'}</h2>
              <button onClick={() => { setShowModal(false); setEditing(null) }} className="text-gray-500 hover:text-gray-700">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Name</label>
                  <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Type</label>
                  <select value={editing.type} onChange={(e) => setEditing({ ...editing, type: e.target.value as any })} className="w-full border rounded px-3 py-2">
                    <option value="operational">Operational (Green)</option>
                    <option value="warning">Warning (Yellow)</option>
                    <option value="no-fly">No-Fly (Red)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Description</label>
                <input value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="w-full border rounded px-3 py-2" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Shape</label>
                  <select value={editing.shape || 'circle'} onChange={(e) => setEditing({ ...editing, shape: e.target.value as any })} className="w-full border rounded px-3 py-2">
                    <option value="circle">Circle</option>
                    <option value="polygon">Polygon</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Altitude Min / Max (m)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" value={editing.altitudeRange?.min ?? ''} onChange={(e) => setEditing({ ...editing, altitudeRange: { ...(editing.altitudeRange || { min: 0 }), min: Number(e.target.value) } })} className="w-full border rounded px-3 py-2" />
                    <input type="number" value={editing.altitudeRange?.max ?? ''} onChange={(e) => setEditing({ ...editing, altitudeRange: { ...(editing.altitudeRange || { min: 0 }), max: Number(e.target.value) } })} className="w-full border rounded px-3 py-2" />
                  </div>
                </div>
              </div>
              {(!editing.shape || editing.shape === 'circle') ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Lat</label>
                    <input type="number" value={editing.center?.lat ?? ''} onChange={(e) => setEditing({ ...editing, center: { ...(editing.center || { lng: 0 }), lat: Number(e.target.value) } })} className="w-full border rounded px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Lng</label>
                    <input type="number" value={editing.center?.lng ?? ''} onChange={(e) => setEditing({ ...editing, center: { ...(editing.center || { lat: 0 }), lng: Number(e.target.value) } })} className="w-full border rounded px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Radius (m)</label>
                    <input type="number" value={editing.radius ?? 1000} onChange={(e) => setEditing({ ...editing, radius: Number(e.target.value) })} className="w-full border rounded px-3 py-2" />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Polygon (lat:lng; lat:lng; ...)</label>
                  <textarea value={(editing.polygon || []).map(p => `${p.lat}:${p.lng}`).join('; ')} onChange={(e) => {
                    const pts = e.target.value.split(';').map(s => s.trim()).filter(Boolean).map(p => { const [la, ln] = p.split(':'); return { lat: Number(la), lng: Number(ln) } })
                    setEditing({ ...editing, polygon: pts })
                  }} className="w-full border rounded px-3 py-2 min-h-[80px]" />
                </div>
              )}
            </div>
            <div className="px-5 py-4 border-t flex items-center justify-end gap-2">
              {editing.id && (
                <button onClick={() => removeZone(editing.id)} className="px-4 py-2 text-red-600 hover:bg-red-50 rounded">Delete</button>
              )}
              <button onClick={() => { setShowModal(false); setEditing(null) }} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">Cancel</button>
              <button onClick={() => upsertZone(editing)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
