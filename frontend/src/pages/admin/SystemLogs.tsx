import React, { useState } from 'react';
import { Search, Download, RefreshCw } from 'lucide-react';

interface Log {
  id: number;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  service: string;
  message: string;
  correlationId: string;
}

const mockLogs: Log[] = [
  { id: 1, timestamp: '2024-12-06 10:45:23', level: 'info', service: 'backend', message: 'Delivery DLV-1234 assigned to drone DRN-001', correlationId: 'abc123' },
  { id: 2, timestamp: '2024-12-06 10:44:15', level: 'warn', service: 'celery', message: 'Route optimization took longer than expected (3.2s)', correlationId: 'def456' },
  { id: 3, timestamp: '2024-12-06 10:43:02', level: 'error', service: 'channels', message: 'WebSocket connection lost for user user@example.com', correlationId: 'ghi789' },
  { id: 4, timestamp: '2024-12-06 10:42:18', level: 'info', service: 'backend', message: 'Weather data updated for Zone A', correlationId: 'jkl012' },
  { id: 5, timestamp: '2024-12-06 10:41:05', level: 'info', service: 'backend', message: 'Drone DRN-003 maintenance completed', correlationId: 'mno345' },
];

const SystemLogs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const getLogLevelColor = (level: 'info' | 'warn' | 'error') => {
    const colors = {
      info: 'bg-blue-100 text-blue-800',
      warn: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
    };
    return colors[level] || colors.info;
  };

  const filteredLogs = mockLogs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.correlationId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = selectedStatus === 'all' || log.level === selectedStatus;
    return matchesSearch && matchesLevel;
  });

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search logs by message or correlation ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Levels</option>
            <option value="info">Info</option>
            <option value="warn">Warning</option>
            <option value="error">Error</option>
          </select>
          
          <button className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
            <Download className="w-5 h-5" />
            <span>Export</span>
          </button>
          
          <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <RefreshCw className="w-5 h-5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Correlation ID</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredLogs.map(log => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">{log.timestamp}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getLogLevelColor(log.level)}`}>
                    {log.level.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.service}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{log.message}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{log.correlationId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SystemLogs;
