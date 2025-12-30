import { useState, useEffect } from 'react'
import {
  Cloud,
  Sun,
  CloudRain,
  Wind,
  Thermometer,
  Droplets,
  Eye,
  AlertTriangle,
  TrendingUp,
  XCircle
} from 'lucide-react'
import { WeatherData, WeatherForecast, ForecastEntry, Zone } from '../../lib/types'

export default function Weather() {
  const [weatherData, setWeatherData] = useState<WeatherData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForecast, setShowForecast] = useState(false)
  const [forecastLoading, setForecastLoading] = useState(false)
  const [selectedZoneId, setSelectedZoneId] = useState<number>(1)
  const [forecast, setForecast] = useState<WeatherForecast | null>(null)
  const [zones, setZones] = useState<Zone[]>([])

  const API_KEY = (import.meta as any).env?.VITE_OPENWEATHER_API_KEY as string | undefined
  // Load zones from localStorage (if present) else public file
  useEffect(() => {
    let cancelled = false
    const loadZones = async () => {
      try {
        const stored = localStorage.getItem('zones')
        if (stored) {
          if (!cancelled) setZones(JSON.parse(stored))
          return
        }
        const res = await fetch('/zones.json')
        if (res.ok) {
          const data = await res.json()
          if (!cancelled) setZones(data)
        }
      } catch (e) {
        // ignore and leave zones empty
      }
    }
    loadZones()
    return () => { cancelled = true }
  }, [])

  // Build representative points for zones (circle center or polygon centroid)
  const ZONE_POINTS: Array<{ id: number; name: string; lat: number; lng: number }> = (zones || [])
    .filter(z => z?.isActive !== false)
    .map((z, idx) => {
      let lat = 0, lng = 0
      if ((z.shape === 'circle' || !z.shape) && z.center) {
        lat = z.center.lat
        lng = z.center.lng
      } else if (z.polygon && z.polygon.length > 0) {
        const n = z.polygon.length
        lat = z.polygon.reduce((a, p) => a + p.lat, 0) / n
        lng = z.polygon.reduce((a, p) => a + p.lng, 0) / n
      }
      return { id: z.id ?? (idx + 1), name: z.name, lat, lng }
    })
    .filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng))

  const degToCompass = (num: number) => {
    const val = Math.round(num / 22.5)
    const arr = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW']
    return arr[(val % 16 + 16) % 16]
  }

  const mapCondition = (main: string): WeatherData['conditions'] => {
    switch ((main || '').toLowerCase()) {
      case 'clear': return 'clear'
      case 'clouds': return 'cloudy'
      case 'rain':
      case 'drizzle': return 'rainy'
      case 'thunderstorm': return 'stormy'
      default: return 'cloudy'
    }
  }

  const deriveAlerts = (d: WeatherData): string[] => {
    const alerts: string[] = []
    if (d.conditions === 'rainy') alerts.push('Rain expected — check water ingress protection')
    if (d.windSpeed >= 25) alerts.push('Strong winds — consider delaying operations')
    if (d.visibility < 5) alerts.push('Reduced visibility — adjust altitude and speed')
    return alerts
  }

  useEffect(() => {
    let cancelled = false
    const fetchAll = async () => {
      // Initialize selected zone id on first load
      if (ZONE_POINTS.length > 0 && (!selectedZoneId || !ZONE_POINTS.find(z => z.id === selectedZoneId))) {
        setSelectedZoneId(ZONE_POINTS[0].id)
      }

      if (!API_KEY) {
        setError('Missing VITE_OPENWEATHER_API_KEY — set it in your .env')
        setLoading(false)
        return
      }
      if (ZONE_POINTS.length === 0) {
        setError('No zones available to load weather for')
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        const results: WeatherData[] = [] //curl "https://api.openweathermap.org/data/2.5/weather?lat=12.9716&lon=77.5946&units=metric&appid=fdfbecb1925e85a70ee72675bfe605a4"
        for (const z of ZONE_POINTS) {
          const url = `https://api.openweathermap.org/data/2.5/weather?lat=${z.lat}&lon=${z.lng}&appid=${API_KEY}&units=metric`
          const res = await fetch(url)
          if (res.status === 401) {
            throw new Error('OpenWeather API key is invalid or unauthorized (401). Update VITE_OPENWEATHER_API_KEY and restart dev server.')
          }
          if (!res.ok) throw new Error(`Fetch failed for ${z.name}: ${res.status}`)
          const w = await res.json()
          const item: WeatherData = {
            id: z.id,
            location: z.name,
            lat: z.lat,
            lng: z.lng,
            temperature: Math.round(w.main?.temp ?? 0),
            humidity: Math.round(w.main?.humidity ?? 0),
            windSpeed: Math.round((w.wind?.speed ?? 0) * 3.6), // m/s -> km/h
            windDirection: degToCompass(w.wind?.deg ?? 0),
            visibility: Math.max(0, Math.round((w.visibility ?? 0) / 1000)), // m -> km
            conditions: mapCondition(w.weather?.[0]?.main ?? ''),
            pressure: Math.round(w.main?.pressure ?? 0),
            lastUpdated: new Date().toISOString(),
          }
          item.alerts = deriveAlerts(item)
          results.push(item)
        }
        if (!cancelled) {
          setWeatherData(results)
          setError(null)
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Failed to fetch weather')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchAll()
    return () => { cancelled = true }
  }, [zones])

  const fetchForecast = async (zoneId: number) => {
    const zone = ZONE_POINTS.find(z => z.id === zoneId) || ZONE_POINTS[0]
    if (!API_KEY) {
      setForecast(null)
      return
    }
    try {
      setForecastLoading(true)
      const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${zone.lat}&lon=${zone.lng}&appid=${API_KEY}&units=metric`
      const res = await fetch(url)
      if (res.status === 401) {
        throw new Error('OpenWeather API key is invalid or unauthorized (401). Update VITE_OPENWEATHER_API_KEY and restart dev server.')
      }
      if (!res.ok) throw new Error(`Forecast fetch failed: ${res.status}`)
      const data = await res.json()
      const hourly: ForecastEntry[] = (data.list || []).slice(0, 8).map((e: any) => ({
        timestamp: e.dt_txt || new Date(e.dt * 1000).toISOString(),
        temperature: Math.round(e.main?.temp ?? 0),
        conditions: mapCondition(e.weather?.[0]?.main ?? ''),
        windSpeed: Math.round((e.wind?.speed ?? 0) * 3.6),
        humidity: Math.round(e.main?.humidity ?? 0),
        precipitation: (e.rain?.['3h'] ?? e.snow?.['3h'] ?? null) as number | null,
      }))
      setForecast({ location: zone.name, lat: zone.lat, lng: zone.lng, hourly })
    } catch (err) {
      setForecast(null)
    } finally {
      setForecastLoading(false)
    }
  }

  const getWeatherIcon = (conditions: string) => {
    switch (conditions) {
      case 'clear': return <Sun className="w-8 h-8 text-yellow-500" />
      case 'cloudy': return <Cloud className="w-8 h-8 text-gray-500" />
      case 'rainy': return <CloudRain className="w-8 h-8 text-blue-500" />
      case 'stormy': return <AlertTriangle className="w-8 h-8 text-red-500" />
      default: return <Cloud className="w-8 h-8 text-gray-500" />
    }
  }

  const getTemperatureColor = (temp: number) => {
    if (temp < 20) return 'text-blue-600'
    if (temp > 35) return 'text-red-600'
    return 'text-green-600'
  }

  const getVisibilityColor = (visibility: number) => {
    if (visibility < 5) return 'text-red-600'
    if (visibility < 8) return 'text-yellow-600'
    return 'text-green-600'
  }

  const averageTemp = weatherData.length > 0
    ? Math.round(weatherData.reduce((acc, w) => acc + w.temperature, 0) / weatherData.length)
    : 0

  const locationsWithAlerts = weatherData.filter(w => w.alerts && w.alerts.length > 0).length
  const poorVisibilityLocations = weatherData.filter(w => w.visibility < 8).length

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
        <button
          onClick={() => { setShowForecast(true); fetchForecast(selectedZoneId) }}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <TrendingUp className="w-4 h-4" />
          <span>View Forecast</span>
        </button>
        <button
          onClick={() => window.location.reload()}
          className="ml-3 text-sm text-gray-600 hover:text-gray-800 underline"
        >
          Retry
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Average Temperature</p>
              <p className={`text-3xl font-bold mt-2 ${getTemperatureColor(averageTemp)}`}>
                {averageTemp}°C
              </p>
            </div>
            <Thermometer className="w-10 h-10 text-red-500" />
          </div>
          <p className="text-xs text-gray-600 mt-2">Across all zones</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Weather Alerts</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">{locationsWithAlerts}</p>
            </div>
            <AlertTriangle className="w-10 h-10 text-orange-500" />
          </div>
          <p className="text-xs text-gray-600 mt-2">Active warnings</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Poor Visibility</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{poorVisibilityLocations}</p>
            </div>
            <Eye className="w-10 h-10 text-yellow-500" />
          </div>
          <p className="text-xs text-gray-600 mt-2">Zones affected</p>
        </div>
      </div>

      {/* Weather Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {weatherData.map((weather) => (
          <div key={weather.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{weather.location}</h3>
                <p className="text-sm text-gray-500">
                  Updated {new Date(weather.lastUpdated).toLocaleTimeString()}
                </p>
              </div>
              {getWeatherIcon(weather.conditions)}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Thermometer className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-600">Temperature</span>
                </div>
                <span className={`font-semibold ${getTemperatureColor(weather.temperature)}`}>
                  {weather.temperature}°C
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Droplets className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-600">Humidity</span>
                </div>
                <span className="font-semibold">{weather.humidity}%</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Wind className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-600">Wind</span>
                </div>
                <span className="font-semibold">
                  {weather.windSpeed} km/h {weather.windDirection}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Eye className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-600">Visibility</span>
                </div>
                <span className={`font-semibold ${getVisibilityColor(weather.visibility)}`}>
                  {weather.visibility} km
                </span>
              </div>
              </div>

            {weather.alerts && weather.alerts.length > 0 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Weather Alerts</p>
                    <ul className="text-sm text-yellow-700 mt-1">
                      {weather.alerts.map((alert, index) => (
                        <li key={index}>• {alert}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Forecast Modal */}
      {showForecast && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="text-lg font-semibold">Forecast</h2>
              <button onClick={() => setShowForecast(false)} className="text-gray-500 hover:text-gray-700">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-600">Zone</label>
                <select
                  className="px-3 py-2 border rounded-md"
                  value={selectedZoneId}
                  onChange={(e) => { const id = parseInt(e.target.value, 10); setSelectedZoneId(id); fetchForecast(id) }}
                >
                  {ZONE_POINTS.map(z => (
                    <option key={z.id} value={z.id}>{z.name}</option>
                  ))}
                </select>
              </div>
              {forecastLoading && (
                <div className="flex items-center justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              )}
              {!forecastLoading && forecast && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">Next 24 hours for {forecast.location}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                    {forecast.hourly.map((h, idx) => (
                      <div key={idx} className="border rounded-lg p-3 flex items-center justify-between">
                        <div>
                          <div className="text-sm text-gray-500">{new Date(h.timestamp).toLocaleString()}</div>
                          <div className="text-xs text-gray-600">Wind {h.windSpeed} km/h • Humidity {h.humidity}%</div>
                          {typeof h.precipitation === 'number' && (
                            <div className="text-xs text-blue-600">Precip: {h.precipitation.toFixed(1)} mm</div>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          {getWeatherIcon(h.conditions)}
                          <div className="text-xl font-semibold">{h.temperature}°C</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {!forecastLoading && !forecast && (
                <p className="text-sm text-gray-600">No forecast available. Check your API key and network.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
