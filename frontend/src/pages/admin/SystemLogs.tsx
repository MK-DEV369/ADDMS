import React, { useState, useEffect } from 'react';
import { Search, Download, RefreshCw, Trash2, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import { Log } from '@/lib/types';

const SystemLogs = () => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch logs from API
  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Base API already includes /api; keep path relative here to avoid double /api/api
      let url = '/analytics/logs/?limit=100&ordering=-timestamp';
      if (selectedLevel !== 'all') {
        url += `&level=${selectedLevel}`;
      }
      
      const response = await api.get(url);
      const data = response.data;
      setLogs(Array.isArray(data.results) ? data.results : Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to fetch logs', err);
      setError('Failed to load system logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    
    // Auto-refresh every 5 seconds if enabled
    if (autoRefresh) {
      const interval = setInterval(fetchLogs, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedLevel, autoRefresh]);

  const handleClearOldLogs = async () => {
    if (!confirm('Are you sure you want to clear old logs? (Keeping last 10)')) return;
    
    try {
      await api.post('/analytics/logs/cleanup/', { keep_count: 10 });
      alert('Old logs cleared successfully');
      await fetchLogs();
    } catch (err: any) {
      alert('Failed to clear logs: ' + (err?.response?.data?.error || err.message));
    }
  };

  const handleClearAll = async () => {
    if (!confirm('WARNING: This will delete ALL logs. This action cannot be undone. Continue?')) return;
    
    try {
      await api.post('/analytics/logs/clear_all/', {});
      alert('All logs cleared');
      setLogs([]);
    } catch (err: any) {
      alert('Failed to clear logs: ' + (err?.response?.data?.error || err.message));
    }
  };

  const handleDownload = () => {
    const csv = [
      ['Timestamp', 'Level', 'Service', 'Message', 'Correlation ID'].join(','),
      ...filteredLogs.map(log => [
        log.timestamp,
        log.level_display,
        log.service,
        `"${log.message.replace(/"/g, '""')}"`,
        log.correlation_id || ''
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-logs-${new Date().toISOString()}.csv`;
    a.click();
  };

  const getLogLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      debug: 'bg-gray-100 text-gray-800',
      info: 'bg-blue-100 text-blue-800',
      warning: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
      critical: 'bg-red-200 text-red-900',
    };
    return colors[level] || colors.info;
  };

  const getServiceColor = (service: string) => {
    const colors: Record<string, string> = {
      backend: 'text-purple-600',
      celery: 'text-orange-600',
      channels: 'text-green-600',
      analytics: 'text-blue-600',
      drones: 'text-indigo-600',
      deliveries: 'text-pink-600',
    };
    return colors[service] || 'text-gray-600';
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (log.correlation_id?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         log.service.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = selectedLevel === 'all' || log.level === selectedLevel;
    return matchesSearch && matchesLevel;
  });

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex-1 relative min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search logs by message, service, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Levels</option>
            <option value="debug">Debug</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
            <option value="critical">Critical</option>
          </select>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">Auto-refresh</span>
          </label>
          
          <button 
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button 
            onClick={handleDownload}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-5 h-5" />
            <span>Export</span>
          </button>
          
          <div className="flex gap-2">
            <button 
              onClick={handleClearOldLogs}
              className="flex items-center space-x-2 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors text-sm"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clean Old</span>
            </button>
            <button 
              onClick={handleClearAll}
              className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear All</span>
            </button>
          </div>
        </div>
      </div>

      {/* Logs Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 shadow">
          <p className="text-sm text-gray-600">Total Logs</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{logs.length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow">
          <p className="text-sm text-gray-600">Errors</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{logs.filter(l => l.level === 'error' || l.level === 'critical').length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow">
          <p className="text-sm text-gray-600">Warnings</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{logs.filter(l => l.level === 'warning').length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow">
          <p className="text-sm text-gray-600">Info</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{logs.filter(l => l.level === 'info').length}</p>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            {loading ? 'Loading logs...' : 'No logs found'}
          </div>
        ) : (
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
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getLogLevelColor(log.level)}`}>
                      {log.level_display || log.level.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${getServiceColor(log.service)}`}>
                      {log.service}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-md truncate" title={log.message}>
                    {log.message}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                    {log.correlation_id ? (
                      <span title={log.correlation_id}>{log.correlation_id.substring(0, 8)}...</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default SystemLogs;
