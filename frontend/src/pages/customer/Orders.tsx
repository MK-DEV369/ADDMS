import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import {
  Package, Search, CheckCircle, XCircle,
  Eye, Download, Plus
} from 'lucide-react';
import { Order, Notification } from '../../lib/types';
import api, { addOrder, deleteOrder as apiDeleteOrder } from '../../lib/api'
import { findNearestPickupLocation, PICKUP_LOCATIONS, PickupLocationWithDistance } from '../../lib/constants'

const haversineDistanceKm = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const R = 6371; // km
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const StatusBadge: React.FC<{ status: Order['status'] }> = ({ status }) => {
  const styles = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    assigned: 'bg-blue-100 text-blue-800 border-blue-200',
    in_transit: 'bg-purple-100 text-purple-800 border-purple-200',
    delivering: 'bg-purple-100 text-purple-800 border-purple-200',
    delivered: 'bg-green-100 text-green-800 border-green-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
  } as Record<string, string>;

  const icons: Record<string, any> = {
    pending: CheckCircle,
    assigned: CheckCircle,
    in_transit: CheckCircle,
    delivering: CheckCircle,
    delivered: CheckCircle,
    cancelled: XCircle,
  };

  const Icon = icons[status] ?? CheckCircle;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${styles[status] ?? 'bg-gray-100 text-gray-800 border-gray-200'}`}>
      <Icon className="w-3 h-3" />
      {String(status).replace('_', ' ').toUpperCase()}
    </span>
  );
};

// New Order Modal Component
const NewOrderModal: React.FC<{ isOpen: boolean; onClose: () => void; onCreate?: (order: Order) => void }> = ({ isOpen, onClose, onCreate }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    pickupAddress: '',
    deliveryAddress: '',
    deliveryLat: '' ,
    deliveryLng: '' ,
    packageWeight: '',
    packageDimensions: { length: '', width: '', height: '' },
    isFragile: false,
    packageName: '',
    packageDescription: '',
    packageType: 'other',
    isUrgent: false,
    requiresTempControl: false,
    temperatureRange: '',
    priority: 'standard',
    scheduledTime: '',
    notes: '',
    droneId: '',
  });

  const [loading, setLoading] = useState(false)

  const [gettingLocation, setGettingLocation] = useState(false)
  const [selectedPickupLocation, setSelectedPickupLocation] = useState<PickupLocationWithDistance | null>(null)

  const computedEstimate = useMemo(() => {
    if (!selectedPickupLocation) return null
    const deliveryLatNum = parseFloat(String(formData.deliveryLat))
    const deliveryLngNum = parseFloat(String(formData.deliveryLng))
    const weight = parseFloat(String(formData.packageWeight))
    if (Number.isNaN(deliveryLatNum) || Number.isNaN(deliveryLngNum)) return null
    const distanceKm = haversineDistanceKm(
      selectedPickupLocation.coordinates.lat,
      selectedPickupLocation.coordinates.lng,
      deliveryLatNum,
      deliveryLngNum
    )
    const effectiveWeight = Math.max(weight || 0, 0.5) // minimum billable weight 0.5 kg
    const baseFee = 50 // INR base dispatch/handling fee
    const perKmPerKg = 10 // INR per km per kg
    const variableCost = distanceKm * perKmPerKg * effectiveWeight
    const totalCost = Math.round((baseFee + variableCost) * 100) / 100
    const cruiseSpeedKmh = 48 // 80% of 60 km/h max
    const handlingBufferMin = 5
    const durationMinutes = Math.round(((distanceKm / cruiseSpeedKmh) * 60 + handlingBufferMin) * 10) / 10
    const etaIso = new Date(Date.now() + durationMinutes * 60000).toISOString()
    console.debug('[Order Estimate] distance_km', distanceKm.toFixed(3), 'weight', effectiveWeight, 'cost', totalCost, 'duration_min', durationMinutes)
    return { distanceKm, totalCost, durationMinutes, etaIso }
  }, [formData.deliveryLat, formData.deliveryLng, formData.packageWeight, selectedPickupLocation])

  const mapDivRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)

  const canProceedToNext = useCallback(() => {
    if (step === 1) {
      return !!formData.packageWeight
    }
    if (step === 2) {
      return !!formData.deliveryAddress || (!!formData.deliveryLat && !!formData.deliveryLng)
    }
    return true
  }, [step, formData])

  // initialize map when step 2 is active
  useEffect(() => {
    if (step !== 2) return
    if (!mapDivRef.current) return
    if (mapInstanceRef.current) return

    // Inject Leaflet CSS if not present
    if (!document.querySelector('link[data-leaflet]')) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      link.setAttribute('data-leaflet', '1')
      document.head.appendChild(link)
    }

    import('leaflet').then((L) => {
      try {
        const leaflet = (L as any)
        const map = leaflet.map(mapDivRef.current).setView([12.9716, 77.5946], 12)
        leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map)

        map.on('click', (e: any) => {
          const lat = e.latlng.lat
          const lng = e.latlng.lng
          setFormData(prev => ({ ...prev, deliveryLat: String(lat), deliveryLng: String(lng) }))
          if (markerRef.current) {
            markerRef.current.setLatLng(e.latlng)
          } else {
            markerRef.current = leaflet.marker(e.latlng).addTo(map)
          }
        })

        // if there are already coords, show marker
        if (formData.deliveryLat && formData.deliveryLng) {
          const lat = parseFloat(formData.deliveryLat)
          const lng = parseFloat(formData.deliveryLng)
          markerRef.current = leaflet.marker([lat, lng]).addTo(map)
          map.setView([lat, lng], 14)
        }

        mapInstanceRef.current = map
      } catch (err) {
        console.error('Leaflet init error', err)
      }
    }).catch(err => {
      console.error('Failed to load leaflet', err)
    })
  }, [step, formData.deliveryLat, formData.deliveryLng])

  // Auto-calculate nearest pickup location when delivery coordinates change
  useEffect(() => {
    if (formData.deliveryLat && formData.deliveryLng) {
      const lat = parseFloat(formData.deliveryLat)
      const lng = parseFloat(formData.deliveryLng)
      if (!isNaN(lat) && !isNaN(lng)) {
        const nearest = findNearestPickupLocation(lat, lng)
        setSelectedPickupLocation(nearest)
      }
    }
  }, [formData.deliveryLat, formData.deliveryLng])

  // access auth to determine role for showing pickup field
  const { user } = useAuthStore()

  // Keep hooks unconditionally called — only early-return after all hooks
  if (!isOpen) return null;

  const handleSubmit = async () => {
    // Build payload matching backend serializers/models
    const packagePayload: any = {
      name: formData.packageName?.trim() || 'Package',
      weight: formData.packageWeight ? parseFloat(String(formData.packageWeight)) : 0,
      dimensions_length: formData.packageDimensions.length ? parseFloat(String(formData.packageDimensions.length)) : null,
      dimensions_width: formData.packageDimensions.width ? parseFloat(String(formData.packageDimensions.width)) : null,
      dimensions_height: formData.packageDimensions.height ? parseFloat(String(formData.packageDimensions.height)) : null,
      is_fragile: !!formData.isFragile,
      description: formData.packageDescription?.trim() || '',
      package_type: formData.packageType,
      is_urgent: !!formData.isUrgent,
      requires_temperature_control: !!formData.requiresTempControl,
      temperature_range: formData.requiresTempControl ? (formData.temperatureRange?.trim() || null) : null,
    }

    const payload: any = {
      delivery_address: formData.deliveryAddress?.trim() || '',
      priority: formData.priority === 'express' ? 2 : 1,
      estimated_eta: formData.scheduledTime || null,
      package: packagePayload,
      notes: formData.notes?.trim() || '',
    }

    // include delivery coordinates if available (as floats)
    if (formData.deliveryLat && formData.deliveryLng) {
      const lat = parseFloat(formData.deliveryLat)
      const lng = parseFloat(formData.deliveryLng)
      if (!isNaN(lat) && !isNaN(lng)) {
        payload.delivery_lat = lat
        payload.delivery_lng = lng
        payload.delivery_location_data = {
          type: 'Point',
          coordinates: [lng, lat]
        }
      }
    }

    // Validate required fields early to avoid backend 500s (delivery_location is required)
    if (!formData.deliveryAddress?.trim()) {
      alert('Delivery address is required')
      return
    }

    if (!(payload.delivery_lat && payload.delivery_lng)) {
      alert('Delivery location coordinates are required. Use the map, geolocation, or enter lat/lng manually.')
      return
    }

    // Automatically select nearest pickup location based on delivery coordinates
    const defaultPickup = PICKUP_LOCATIONS.find(p => p.name.toLowerCase() === 'majestic') || PICKUP_LOCATIONS[0]
    let pickupLocation: PickupLocationWithDistance = { 
      id: defaultPickup.id, 
      name: defaultPickup.name, 
      coordinates: { lat: defaultPickup.coordinates.lat, lng: defaultPickup.coordinates.lng },
      distance: 0
    }; // Default to Majestic base
    if (formData.deliveryLat && formData.deliveryLng) {
      const lat = parseFloat(formData.deliveryLat)
      const lng = parseFloat(formData.deliveryLng)
      if (!isNaN(lat) && !isNaN(lng)) {
        const nearest = findNearestPickupLocation(lat, lng)
        pickupLocation = nearest
        console.debug(`Nearest pickup location: ${nearest.name} (${nearest.distance.toFixed(2)} km away)`)
      }
    }

    // Ensure pickup_address and pickup_location are always included
    payload.pickup_address = pickupLocation.name
    // Backend expects pickup_location (PostGIS Point field) - use nearest location's coordinates
    payload.pickup_location_data = {
      type: 'Point',
      coordinates: [pickupLocation.coordinates.lng, pickupLocation.coordinates.lat] // [lng, lat] for GeoJSON
    }
    // Also send as separate fields for compatibility
    payload.pickup_lat = pickupLocation.coordinates.lat
    payload.pickup_lng = pickupLocation.coordinates.lng

    const parsedDrone = parseInt(String(formData.droneId), 10)
    if (!Number.isNaN(parsedDrone) && parsedDrone > 0) {
      payload.drone = parsedDrone
    }

    // Validate required fields
    if (!formData.packageWeight || parseFloat(String(formData.packageWeight)) <= 0) {
      alert('Valid package weight is required')
      return
    }

    console.debug('Creating order payload:', JSON.stringify(payload, null, 2))
    setLoading(true)
    try {
      const res = await addOrder(payload)
      const created = res.data
      const enriched = { ...created }
      if (computedEstimate) {
        if (!enriched.total_cost) enriched.total_cost = computedEstimate.totalCost
        if (!enriched.estimated_duration_minutes) enriched.estimated_duration_minutes = computedEstimate.durationMinutes
        if (!enriched.estimated_eta) enriched.estimated_eta = computedEstimate.etaIso
      }
      console.debug('Order created (enriched with estimates):', enriched)
      onCreate && onCreate(enriched)
      onClose()
      setStep(1)
      // Reset form
      setFormData({
        pickupAddress: '',
        deliveryAddress: '',
        deliveryLat: '',
        deliveryLng: '',
        packageWeight: '',
        packageDimensions: { length: '', width: '', height: '' },
        isFragile: false,
        packageName: '',
        packageDescription: '',
        packageType: 'other',
        isUrgent: false,
        requiresTempControl: false,
        temperatureRange: '',
        priority: 'standard',
        scheduledTime: '',
        notes: '',
        droneId: '',
      })
    } catch (err: any) {
      console.error('Failed to create order', err)
      console.error('Error status:', err?.response?.status)
      console.error('Error response:', err?.response)
      console.error('Error data:', err?.response?.data)
      // show user a detailed error message
      const errorDetail = err?.response?.data?.detail || err?.response?.data?.error || JSON.stringify(err?.response?.data) || err?.message || 'Server error'
      alert(`Failed to create order: ${errorDetail}`)
    } finally {
      setLoading(false)
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Create New Delivery</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((s) => (
              <React.Fragment key={s}>
                <div className={`flex items-center gap-2 ${step >= s ? 'text-purple-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                    step >= s ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {s}
                  </div>
                  <span className="text-sm font-medium hidden sm:inline">
                    {s === 1 && 'Package'}
                    {s === 2 && 'Locations'}
                    {s === 3 && 'Schedule'}
                    {s === 4 && 'Confirm'}
                  </span>
                </div>
                {s < 4 && <div className={`flex-1 h-1 mx-2 ${step > s ? 'bg-purple-600' : 'bg-gray-200'}`} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="px-6 py-6">
          {/* Step 1: Package Details */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Package Details</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Weight (kg) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.packageWeight}
                  onChange={(e) => setFormData({ ...formData, packageWeight: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="2.5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Package Name</label>
                <input
                  type="text"
                  value={formData.packageName}
                  onChange={(e) => setFormData({ ...formData, packageName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., Documents"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={formData.packageDescription}
                  onChange={(e) => setFormData({ ...formData, packageDescription: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Brief description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Package Type</label>
                <select
                  value={formData.packageType}
                  onChange={(e) => setFormData({ ...formData, packageType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="document">Document</option>
                  <option value="food">Food</option>
                  <option value="medical">Medical</option>
                  <option value="electronics">Electronics</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dimensions (cm)
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="number"
                    value={formData.packageDimensions.length}
                    onChange={(e) => setFormData({
                      ...formData,
                      packageDimensions: { ...formData.packageDimensions, length: e.target.value }
                    })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="Length"
                  />
                  <input
                    type="number"
                    value={formData.packageDimensions.width}
                    onChange={(e) => setFormData({
                      ...formData,
                      packageDimensions: { ...formData.packageDimensions, width: e.target.value }
                    })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="Width"
                  />
                  <input
                    type="number"
                    value={formData.packageDimensions.height}
                    onChange={(e) => setFormData({
                      ...formData,
                      packageDimensions: { ...formData.packageDimensions, height: e.target.value }
                    })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="Height"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="fragile"
                  checked={formData.isFragile}
                  onChange={(e) => setFormData({ ...formData, isFragile: e.target.checked })}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <label htmlFor="fragile" className="text-sm text-gray-700">
                  Fragile - Handle with care
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="urgent"
                  checked={formData.isUrgent}
                  onChange={(e) => setFormData({ ...formData, isUrgent: e.target.checked })}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <label htmlFor="urgent" className="text-sm text-gray-700">
                  Urgent
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="tempctrl"
                  checked={formData.requiresTempControl}
                  onChange={(e) => setFormData({ ...formData, requiresTempControl: e.target.checked })}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <label htmlFor="tempctrl" className="text-sm text-gray-700">
                  Requires Temperature Control
                </label>
              </div>

              {formData.requiresTempControl && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Temperature Range</label>
                  <input
                    type="text"
                    value={formData.temperatureRange}
                    onChange={(e) => setFormData({ ...formData, temperatureRange: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., 2-8°C"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="standard">Standard (30-45 min)</option>
                  <option value="express">Express (15-20 min) - +₹100</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Any special instructions"
                />
              </div>
            </div>
          )}

          {/* Step 2: Locations */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Pickup & Delivery Locations</h3>

              {/* Auto-selected pickup location display */}
              {selectedPickupLocation && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-blue-900">Auto-Selected Pickup Location</span>
                  </div>
                  <p className="text-sm text-blue-800">
                    <strong>{selectedPickupLocation.name}</strong>
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    {selectedPickupLocation.distance.toFixed(1)} km from delivery location
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Address *
                </label>
                <input
                  type="text"
                  value={formData.deliveryAddress}
                  onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter delivery address"
                />
                <div className="mt-2 flex gap-2 items-center">
                  <button
                    type="button"
                    onClick={() => {
                      if (!navigator.geolocation) return alert('Geolocation not supported')
                      setGettingLocation(true)
                      const opts: PositionOptions = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                      navigator.geolocation.getCurrentPosition((pos) => {
                        const lat = pos.coords.latitude.toString()
                        const lng = pos.coords.longitude.toString()
                        setFormData(prev => ({ ...prev, deliveryLat: lat, deliveryLng: lng }))
                        console.debug('Got current location', lat, lng)
                        setGettingLocation(false)
                      }, (err: GeolocationPositionError) => {
                        console.error('Geolocation error', err)
                        let msg = ''
                        if (err.code === 1) {
                          msg = 'Permission denied. Please allow location access.';
                        } else if (err.code === 2) {
                          msg = 'Position unavailable. Try picking location on map or enter lat/lng.';
                        } else if (err.code === 3) {
                          msg = 'Timeout obtaining position.';
                        } else {
                          msg = err.message || 'Unknown error';
                        }
                        alert('Could not get current location: ' + msg)
                        setGettingLocation(false)
                      }, opts)
                    }}
                    disabled={gettingLocation}
                    className={`px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-sm ${gettingLocation ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >{gettingLocation ? 'Detecting...' : 'Use current location'}</button>
                  <span className="text-xs text-gray-500">{formData.deliveryLat && formData.deliveryLng ? `${formData.deliveryLat}, ${formData.deliveryLng}` : ''}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Delivery Latitude *</label>
                    <input
                      type="number"
                      step="0.000001"
                      value={formData.deliveryLat}
                      onChange={(e) => setFormData({ ...formData, deliveryLat: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="12.9716"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Delivery Longitude *</label>
                    <input
                      type="number"
                      step="0.000001"
                      value={formData.deliveryLng}
                      onChange={(e) => setFormData({ ...formData, deliveryLng: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="77.5946"
                    />
                  </div>
                </div>
              </div>

              {user?.role === 'manager' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Drone (ID, optional)</label>
                  <input
                    type="number"
                    value={formData.droneId}
                    onChange={(e) => setFormData({ ...formData, droneId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter drone ID"
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 3: Schedule */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Scheduling</h3>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setFormData({ ...formData, scheduledTime: '' })}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    !formData.scheduledTime
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold text-gray-900">Immediate</div>
                  <div className="text-sm text-gray-600">Deliver ASAP</div>
                </button>

                <button
                  onClick={() => setFormData({ ...formData, scheduledTime: new Date().toISOString() })}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    formData.scheduledTime
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold text-gray-900">Scheduled</div>
                  <div className="text-sm text-gray-600">Pick a time</div>
                </button>
              </div>

              {formData.scheduledTime && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Scheduled Time
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.scheduledTime.slice(0, 16)}
                    onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 4: Review & Confirm */}
          {step === 4 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Review & Confirm</h3>

              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Package Name</span>
                  <span className="font-medium">{formData.packageName || 'Package'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Package Weight</span>
                  <span className="font-medium">{formData.packageWeight} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Package Type</span>
                  <span className="font-medium capitalize">{formData.packageType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fragile</span>
                  <span className="font-medium">{formData.isFragile ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Urgent</span>
                  <span className="font-medium">{formData.isUrgent ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Temp Control</span>
                  <span className="font-medium">{formData.requiresTempControl ? 'Yes' : 'No'}</span>
                </div>
                {formData.requiresTempControl && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Temperature Range</span>
                    <span className="font-medium">{formData.temperatureRange || '—'}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Priority</span>
                  <span className="font-medium capitalize">{formData.priority}</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between items-start">
                    <span className="text-gray-600">Pickup Location</span>
                    <span className="font-medium text-right max-w-xs">
                      {selectedPickupLocation ? `${selectedPickupLocation.name} (${selectedPickupLocation.distance.toFixed(2)} km away)` : 'Not set'}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-gray-600">Delivery</span>
                  <span className="font-medium text-right max-w-xs">{formData.deliveryAddress || 'Not set'}</span>
                </div>
                {(formData.deliveryLat && formData.deliveryLng) && (
                  <div className="flex justify-between items-start">
                    <span className="text-gray-600">Coordinates</span>
                    <span className="font-medium text-right max-w-xs">{formData.deliveryLat}, {formData.deliveryLng}</span>
                  </div>
                )}
                {formData.notes && (
                  <div className="flex justify-between items-start">
                    <span className="text-gray-600">Notes</span>
                    <span className="font-medium text-right max-w-xs">{formData.notes}</span>
                  </div>
                )}
                {formData.droneId && (
                  <div className="flex justify-between items-start">
                    <span className="text-gray-600">Drone</span>
                    <span className="font-medium text-right max-w-xs">#{formData.droneId}</span>
                  </div>
                )}
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700 font-medium">Estimated Delivery Cost</span>
                  <span className="text-2xl font-bold text-purple-600">
                    {computedEstimate ? `₹${computedEstimate.totalCost.toFixed(2)}` : '—'}
                  </span>
                </div>
                <div className="text-sm text-gray-700 flex flex-col gap-1">
                  <span>
                    {computedEstimate
                      ? `Distance: ${computedEstimate.distanceKm.toFixed(2)} km (billable weight: ${Math.max(parseFloat(String(formData.packageWeight)) || 0, 0.5)} kg)`
                      : 'Add weight and delivery coordinates to see distance and cost'}
                  </span>
                  <span>
                    {computedEstimate
                      ? `Estimated flight time: ${computedEstimate.durationMinutes.toFixed(1)} mins`
                      : 'ETA will appear once coordinates are set'}
                  </span>
                  <span>
                    {computedEstimate
                      ? `Predicted ETA: ${new Date(computedEstimate.etaIso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                      : ''}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="terms"
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 mt-1"
                />
                <label htmlFor="terms" className="text-sm text-gray-600">
                  I agree to the terms and conditions and authorize the delivery
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-between">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Back
            </button>
          )}
          <div className="ml-auto flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            {step < 4 ? (
              <button
                onClick={() => {
                  if (canProceedToNext()) setStep(step + 1)
                  else alert('Please complete the required fields before continuing')
                }}
                disabled={!canProceedToNext()}
                className={`px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors ${!canProceedToNext() ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className={`px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Creating...' : 'Confirm Order'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Orders Component
export default function Orders() {
  const navigate = useNavigate();
  useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications] = useState(false);
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        console.debug('Fetching orders...')
        const res = await api.get('/deliveries/orders/')
        const data = res.data.results ?? res.data
        console.debug('Fetched orders:', data)
        setOrders(data)
      } catch (err) {
        console.error('Failed to fetch orders', err)
      }
    }

    const fetchNotifications = async () => {
      try {
        console.debug('Fetching notifications...')
        const res = await api.get('/notifications/notifications/')
        const data = res.data.results ?? res.data
        console.debug('Fetched notifications:', data)
        setNotifications(data)
      } catch (err) {
        console.error('Failed to fetch notifications', err)
      }
    }

    fetchOrders()
    fetchNotifications()
  }, [])

  // // Advance status or delete handlers
  // const handleAdvanceStatus = async (order: Order) => {
  //   try {
  //     const statuses = ['pending', 'assigned', 'in_transit', 'delivering', 'delivered']
  //     const idx = statuses.indexOf(order.status)
  //     const nextStatus = idx === -1 ? 'assigned' : (idx < statuses.length - 1 ? statuses[idx + 1] : statuses[idx])
  //     if (nextStatus === order.status) {
  //       console.debug('Order already at final status', order.id, order.status)
  //       return
  //     }
  //     console.debug('Updating order status', order.id, '->', nextStatus)
  //     const res = await apiUpdateOrder(order.id as any, { status: nextStatus })
  //     const updated = res.data
  //     setOrders(prev => prev.map(o => (o.id === updated.id ? updated : o)))
  //   } catch (err) {
  //     console.error('Failed to update order', err)
  //   }
  // }

  const handleDeleteOrder = async (id: number | string) => {
    if (!window.confirm('Delete this order?')) return
    try {
      console.debug('Deleting order', id)
      await apiDeleteOrder(id as any)
      setOrders(prev => prev.filter(o => o.id !== id))
    } catch (err) {
      console.error('Failed to delete order', err)
    }
  }

  const filteredOrders = orders.filter(order => {
    const idStr = String(order.id || '')
    const matchesSearch = idStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (order.pickup_address || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (order.delivery_address || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || order.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">

      {/* Notifications Panel */}
      {showNotifications && (
        <div className="absolute right-4 top-20 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            <button
              onClick={async () => {
                const snapshot = notifications
                setNotifications(snapshot.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() })))
                // Try to update backend (best-effort)
                snapshot.filter(n => !n.is_read).forEach(n => {
                  api.patch(`/notifications/notifications/${n.id}/`, { is_read: true }).catch(() => {})
                })
              }}
              className="text-sm text-purple-600 hover:text-purple-700"
            >
              Mark all read
            </button>
          </div>
          <div className="divide-y divide-gray-100">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-4 hover:bg-gray-50 transition-colors ${!notif.is_read ? 'bg-purple-50' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    notif.notification_type === 'delivery_update' ? 'bg-blue-500' :
                    notif.notification_type === 'system_alert' ? 'bg-red-500' :
                    notif.notification_type === 'maintenance' ? 'bg-yellow-500' : 'bg-green-500'
                  }`} />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{notif.title}</p>
                    <p className="text-gray-600 text-sm mt-1">{notif.message}</p>
                    <p className="text-gray-400 text-xs mt-1">
                      {new Date(notif.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search and Filter */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search orders..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
            <option value="in_transit">In Transit</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button
            onClick={() => setShowNewOrderModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Order
          </button>
        </div>

        {/* Orders Table */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Delivery Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ETA / Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-medium text-gray-900">{order.id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{order.delivery_address}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {order.estimated_eta ? new Date(order.estimated_eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    {order.estimated_duration_minutes ? ` · ${order.estimated_duration_minutes.toFixed(1)} mins` : ''}
                    {order.route_summary?.distance_km != null ? ` · ${order.route_summary.distance_km.toFixed(2)} km` : ''}
                    {order.route_summary?.waypoint_count != null ? ` · ${order.route_summary.waypoint_count} wp` : ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-medium text-gray-900">{order.total_cost != null ? `₹${Number(order.total_cost).toFixed(2)}` : '—'}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {order.requested_at ? new Date(order.requested_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/deliveries/orders/${order.id}/`)}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {/* <button
                        onClick={() => handleAdvanceStatus(order)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Advance Status"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button> */}
                      <button
                        onClick={() => handleDeleteOrder(order.id as any)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Order"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                      {order.status === 'delivered' && (
                        <button
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Download Invoice"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No orders found</p>
          </div>
        )}
      </div>

      {/* New Order Modal */}
      <NewOrderModal
        isOpen={showNewOrderModal}
        onClose={() => setShowNewOrderModal(false)}
        onCreate={(order) => setOrders(prev => [order, ...prev])}
      />
    </div>
  );
}
