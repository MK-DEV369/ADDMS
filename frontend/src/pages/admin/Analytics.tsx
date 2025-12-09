import React, { useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  CheckCircle,
  Clock,
  CheckCircle as CheckCircleIcon,
  Battery
} from 'lucide-react';

// Mock data for demonstration
const mockData = {
  activeDeliveries: 23,
  completedToday: 156,
  avgDeliveryTime: 18.5,
  onTimeRate: 94.2,
  totalDrones: 5,
  activeDrones: 3,
  avgBattery: 75.6,
  maintenanceCount: 1
};

const Analytics = () => {
  const kpis = useMemo(() => ({
    activeDeliveries: mockData.activeDeliveries,
    completedToday: mockData.completedToday,
    avgDeliveryTime: mockData.avgDeliveryTime,
    onTimeRate: mockData.onTimeRate,
    totalDrones: mockData.totalDrones,
    activeDrones: mockData.activeDrones,
    avgBattery: mockData.avgBattery,
    maintenanceCount: mockData.maintenanceCount
  }), []);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-600">Active Deliveries</p>
            <Activity className="w-8 h-8 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{kpis.activeDeliveries}</p>
          <div className="flex items-center mt-2 text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600">12%</span>
            <span className="text-gray-500 ml-2">vs yesterday</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-600">Completed Today</p>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{kpis.completedToday}</p>
          <div className="flex items-center mt-2 text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600">8%</span>
            <span className="text-gray-500 ml-2">vs yesterday</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-600">Avg Delivery Time</p>
            <Clock className="w-8 h-8 text-purple-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{kpis.avgDeliveryTime} min</p>
          <div className="flex items-center mt-2 text-sm">
            <TrendingDown className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600">2 min</span>
            <span className="text-gray-500 ml-2">faster</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-600">On-Time Rate</p>
            <CheckCircleIcon className="w-8 h-8 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{kpis.onTimeRate}%</p>
          <div className="flex items-center mt-2 text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600">1.2%</span>
            <span className="text-gray-500 ml-2">improvement</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deliveries Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Deliveries Overview</h3>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded">
            <p className="text-gray-500">Line Chart: Deliveries over last 30 days</p>
          </div>
        </div>

        {/* Drone Status Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Fleet Status Distribution</h3>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded">
            <p className="text-gray-500">Pie Chart: Drone status breakdown</p>
          </div>
        </div>

        {/* Zone Performance */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Deliveries by Zone</h3>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded">
            <p className="text-gray-500">Bar Chart: Deliveries per operational zone</p>
          </div>
        </div>

        {/* Battery Trends */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Battery Usage Trends</h3>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded">
            <p className="text-gray-500">Area Chart: Average battery levels over time</p>
          </div>
        </div>
      </div>

      {/* Fleet Efficiency Metrics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Fleet Efficiency Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border-l-4 border-blue-500 pl-4">
            <p className="text-sm font-medium text-gray-600">Utilization Rate</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">78.5%</p>
            <p className="text-sm text-gray-500 mt-1">Average fleet utilization</p>
          </div>
          <div className="border-l-4 border-green-500 pl-4">
            <p className="text-sm font-medium text-gray-600">Avg Downtime</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">2.3 hrs</p>
            <p className="text-sm text-gray-500 mt-1">Per drone per day</p>
          </div>
          <div className="border-l-4 border-purple-500 pl-4">
            <p className="text-sm font-medium text-gray-600">Success Rate</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">96.7%</p>
            <p className="text-sm text-gray-500 mt-1">Successful deliveries</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
