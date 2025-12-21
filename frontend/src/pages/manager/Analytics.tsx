import { useState, useEffect } from 'react'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  Package,
  Users,
  Activity
} from 'lucide-react'

interface AnalyticsData {
  totalDeliveries: number
  totalRevenue: number
  averageDeliveryTime: number
  successRate: number
  fleetUtilization: number
  monthlyData: Array<{
    month: string
    deliveries: number
    revenue: number
  }>
  hourlyData: Array<{
    hour: string
    deliveries: number
  }>
}

export default function Analytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  // Mock data - replace with real API call
  useEffect(() => {
    const mockData: AnalyticsData = {
      totalDeliveries: 1250,
      totalRevenue: 45250,
      averageDeliveryTime: 42,
      successRate: 96.8,
      fleetUtilization: 78.5,
      monthlyData: [
        { month: 'Jan', deliveries: 180, revenue: 6500 },
        { month: 'Feb', deliveries: 195, revenue: 7025 },
        { month: 'Mar', deliveries: 210, revenue: 7575 },
        { month: 'Apr', deliveries: 185, revenue: 6675 },
        { month: 'May', deliveries: 201, revenue: 7100 },
        { month: 'Jun', deliveries: 279, revenue: 10375 }
      ],
      hourlyData: [
        { hour: '06:00', deliveries: 12 },
        { hour: '08:00', deliveries: 28 },
        { hour: '10:00', deliveries: 35 },
        { hour: '12:00', deliveries: 38 },
        { hour: '14:00', deliveries: 42 },
        { hour: '16:00', deliveries: 39 },
        { hour: '18:00', deliveries: 31 },
        { hour: '20:00', deliveries: 18 }
      ]
    }

    setTimeout(() => {
      setAnalyticsData(mockData)
      setLoading(false)
    }, 1000)
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 95) return 'text-green-600'
    if (rate >= 90) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 80) return 'text-green-600'
    if (utilization >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading || !analyticsData) {
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
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Performance metrics and operational insights</p>
        </div>
        <div className="flex items-center space-x-2">
          <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option>Last 30 days</option>
            <option>Last 90 days</option>
            <option>Last 6 months</option>
            <option>Last year</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Deliveries</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{analyticsData.totalDeliveries.toLocaleString()}</p>
              <p className="text-xs text-green-600 mt-1 flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" />
                +12.5% from last month
              </p>
            </div>
            <Package className="w-10 h-10 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{formatCurrency(analyticsData.totalRevenue)}</p>
              <p className="text-xs text-green-600 mt-1 flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" />
                +18.7% from last month
              </p>
            </div>
            <DollarSign className="w-10 h-10 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Avg Delivery Time</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{analyticsData.averageDeliveryTime}min</p>
              <p className="text-xs text-green-600 mt-1 flex items-center">
                <TrendingDown className="w-3 h-3 mr-1" />
                -5.2% from last month
              </p>
            </div>
            <Clock className="w-10 h-10 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Success Rate</p>
              <p className={`text-3xl font-bold mt-2 ${getSuccessRateColor(analyticsData.successRate)}`}>
                {analyticsData.successRate}%
              </p>
              <p className="text-xs text-green-600 mt-1 flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" />
                +2.1% from last month
              </p>
            </div>
            <Activity className="w-10 h-10 text-indigo-500" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Deliveries Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Monthly Deliveries</h3>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {analyticsData.monthlyData.map((month, index) => (
              <div key={month.month} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 w-12">{month.month}</span>
                <div className="flex-1 mx-4">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(month.deliveries / Math.max(...analyticsData.monthlyData.map(m => m.deliveries))) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-900">{month.deliveries}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hourly Distribution */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Hourly Distribution</h3>
            <Clock className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {analyticsData.hourlyData.map((hour, index) => (
              <div key={hour.hour} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 w-16">{hour.hour}</span>
                <div className="flex-1 mx-4">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${(hour.deliveries / Math.max(...analyticsData.hourlyData.map(h => h.deliveries))) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-900">{hour.deliveries}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fleet Utilization */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Fleet Utilization</h3>
          <Activity className="w-5 h-5 text-gray-400" />
        </div>
        <div className="flex items-center space-x-6">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Current Utilization</span>
              <span className={`text-lg font-bold ${getUtilizationColor(analyticsData.fleetUtilization)}`}>
                {analyticsData.fleetUtilization}%
              </span>
            </div>
            <div className="bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full ${analyticsData.fleetUtilization >= 80 ? 'bg-green-600' : analyticsData.fleetUtilization >= 60 ? 'bg-yellow-600' : 'bg-red-600'}`}
                style={{ width: `${analyticsData.fleetUtilization}%` }}
              ></div>
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">23/30</div>
            <div className="text-sm text-gray-600">Active Drones</div>
          </div>
        </div>
      </div>
    </div>
  )
}
