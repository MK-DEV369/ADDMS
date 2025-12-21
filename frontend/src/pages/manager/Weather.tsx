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
  TrendingUp
} from 'lucide-react'

interface WeatherData {
  id: number
  location: string
  temperature: number
  humidity: number
  windSpeed: number
  windDirection: string
  visibility: number
  conditions: 'clear' | 'cloudy' | 'rainy' | 'stormy'
  pressure: number
  lastUpdated: string
  alerts?: string[]
}

export default function Weather() {
  const [weatherData, setWeatherData] = useState<WeatherData[]>([])
  const [loading, setLoading] = useState(true)

  // Mock data - replace with real API call
  useEffect(() => {
    const mockWeather: WeatherData[] = [
      {
        id: 1,
        location: 'Downtown Bangalore',
        temperature: 28,
        humidity: 65,
        windSpeed: 12,
        windDirection: 'SW',
        visibility: 8,
        conditions: 'cloudy',
        pressure: 1013,
        lastUpdated: new Date().toISOString(),
        alerts: ['Light rain expected in 2 hours']
      },
      {
        id: 2,
        location: 'Airport Area',
        temperature: 26,
        humidity: 70,
        windSpeed: 15,
        windDirection: 'NW',
        visibility: 6,
        conditions: 'rainy',
        pressure: 1008,
        lastUpdated: new Date(Date.now() - 300000).toISOString(),
        alerts: ['Strong winds affecting flight operations', 'Reduced visibility']
      },
      {
        id: 3,
        location: 'Residential Zone',
        temperature: 30,
        humidity: 55,
        windSpeed: 8,
        windDirection: 'SE',
        visibility: 10,
        conditions: 'clear',
        pressure: 1015,
        lastUpdated: new Date(Date.now() - 600000).toISOString()
      }
    ]

    setTimeout(() => {
      setWeatherData(mockWeather)
      setLoading(false)
    }, 1000)
  }, [])

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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Weather Monitor</h1>
          <p className="text-gray-600">Real-time weather conditions affecting drone operations</p>
        </div>
        <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <TrendingUp className="w-4 h-4" />
          <span>View Forecast</span>
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
    </div>
  )
}
