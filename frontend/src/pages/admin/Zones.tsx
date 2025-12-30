import { useState, useEffect } from 'react';
import {
  MapPin,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertCircle,
  RefreshCw,
  Loader
} from 'lucide-react';
import api from '@/lib/api';

// Type definitions
interface Zone {
  id?: number;
  name: string;
  type: 'operational' | 'no-fly' | 'warning';
  area: number;
  status: 'active' | 'maintenance' | 'error';
  deliveries?: number;
  violations?: number;
  description?: string;
  center?: { lat: number; lng: number };
  radius?: number;
  polygon?: Array<{ lat: number; lng: number }>;
  altitudeRange?: { min: number; max: number };
  isActive?: boolean;
}

const Zones = () => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedItem, setSelectedItem] = useState<Zone | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Zone>({
    name: '',
    type: 'operational',
    area: 0,
    status: 'active',
    description: '',
    altitudeRange: { min: 0, max: 5000 }
  });

  // Fetch zones from API with 3-tier fallback
  const fetchZones = async () => {
    try {
      setError(null);
      const res = await api.get('/zones/zones/');
      const data = res.data.results || res.data;
      const zonesData = Array.isArray(data) ? data : [];
      setZones(zonesData);
      localStorage.setItem('adminZones', JSON.stringify(zonesData));
      console.debug('Fetched zones from API:', zonesData);
    } catch (err: any) {
      console.error('Failed to fetch zones from API', err);

      // Fallback to localStorage
      const stored = localStorage.getItem('adminZones');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setZones(parsed);
          console.debug('Loaded zones from localStorage');
          return;
        } catch (e) {
          console.error('Failed to parse localStorage zones', e);
        }
      }

      // Fallback to public file
      try {
        const res = await fetch('/zones.json');
        const data = await res.json();
        setZones(data);
        localStorage.setItem('adminZones', JSON.stringify(data));
        console.debug('Loaded zones from public file');
      } catch (fileErr) {
        console.error('Failed to load zones from public file', fileErr);
        setError('Failed to load zones. Please try again or refresh.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  const openModal = (type: string, item: Zone | null = null) => {
    setModalType(type);
    setSelectedItem(item);
    if (item) {
      setFormData(item);
    } else {
      setFormData({
        name: '',
        type: 'operational',
        area: 0,
        status: 'active',
        description: '',
        altitudeRange: { min: 0, max: 5000 }
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedItem(null);
    setSaving(false);
    setError(null);
  };

  const saveZone = async () => {
    // Validate form
    if (!formData.name.trim()) {
      alert("Zone Name is Required");
      setError('Zone name is required');
      return;
    }
    if (formData.area <= 0) {
      alert("Area must be greater than 0");
      setError('Area must be greater than 0');
      return;
    }

    setSaving(true);
    try {
      setError(null);
      if (selectedItem?.id) {
        // Update existing zone
        await api.patch(`/zones/zones/${selectedItem.id}/`, formData);
        console.debug(`Updated zone ${selectedItem.id}`);
      } else {
        // Create new zone
        await api.post('/zones/zones/', formData);
        console.debug('Created new zone');
      }

      // Refresh zones list
      await fetchZones();
      closeModal();
    } catch (err: any) {
      console.error('Failed to save zone', err);
      setError(`Failed to save zone: ${err?.response?.data?.detail || err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const deleteZone = async () => {
    if (!selectedItem?.id) return;

    setSaving(true);
    try {
      setError(null);
      await api.delete(`/zones/zones/${selectedItem.id}/`);
      console.debug(`Deleted zone ${selectedItem.id}`);
      await fetchZones();
      closeModal();
    } catch (err: any) {
      console.error('Failed to delete zone', err);
      setError(`Failed to delete zone: ${err?.response?.data?.detail || err.message}`);
      setSaving(false);
    }
  };

  // Filter functions
  const filteredZones = zones.filter(zone => {
    const matchesSearch = zone.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || zone.type === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'operational':
        return 'bg-green-500';
      case 'no-fly':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Banner */}
      {error && !showModal && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              setRefreshing(true);
              fetchZones();
            }}
            className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-800 rounded transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex-1 relative min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search zones..."
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
            <option value="all">All Types</option>
            <option value="operational">Operational</option>
            <option value="warning">Warning</option>
            <option value="no-fly">No-Fly</option>
          </select>

          <button
            onClick={() => {
              setRefreshing(true);
              fetchZones();
            }}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => openModal('addZone')}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Add Zone</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-600">Total Zones</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{zones.length}</p>
          <p className="text-xs text-gray-500 mt-1">All configured zones</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-600">Operational</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {zones.filter(z => z.type === 'operational').length}
          </p>
          <p className="text-xs text-gray-500 mt-1">Active zones</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-600">Warning</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">
            {zones.filter(z => z.type === 'warning').length}
          </p>
          <p className="text-xs text-gray-500 mt-1">Caution zones</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-600">No-Fly</p>
          <p className="text-2xl font-bold text-red-600 mt-1">
            {zones.filter(z => z.type === 'no-fly').length}
          </p>
          <p className="text-xs text-gray-500 mt-1">Restricted zones</p>
        </div>
      </div>

      {/* Zones Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredZones.length > 0 ? (
          filteredZones.map(zone => (
            <div key={zone.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className={`h-2 rounded-t-lg ${getTypeColor(zone.type)}`} />
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{zone.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{zone.area} km²</p>
                    {zone.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{zone.description}</p>
                    )}
                  </div>
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    zone.type === 'operational' ? 'bg-green-100 text-green-800' :
                    zone.type === 'no-fly' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {zone.type.replace('_', ' ')}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Status:</span>
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      getStatusColor(zone.status)
                    }`}>
                      {zone.status}
                    </span>
                  </div>
                  {zone.type === 'operational' && zone.deliveries !== undefined && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Deliveries:</span>
                      <span className="font-semibold text-gray-900">{zone.deliveries}</span>
                    </div>
                  )}
                  {zone.type === 'no-fly' && zone.violations !== undefined && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Violations:</span>
                      <span className={`font-semibold ${zone.violations > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {zone.violations}
                      </span>
                    </div>
                  )}
                  {zone.altitudeRange && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Altitude:</span>
                      <span className="font-semibold text-gray-900">
                        {zone.altitudeRange.min}-{zone.altitudeRange.max}m
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex space-x-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => openModal('editZone', zone)}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => openModal('deleteZone', zone)}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No zones found</p>
          </div>
        )}
      </div>

      {/* Add/Edit Zone Modal */}
      {showModal && (modalType === 'addZone' || modalType === 'editZone') && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {selectedItem ? 'Edit Zone' : 'Add New Zone'}
            </h2>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Zone Name *</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter zone name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Type *</label>
                <select
                  value={formData.type || 'operational'}
                  onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                  className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="operational">Operational</option>
                  <option value="warning">Warning</option>
                  <option value="no-fly">No-Fly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Area (km²) *</label>
                <input
                  type="number"
                  value={formData.area || ''}
                  onChange={e => setFormData({ ...formData, area: e.target.value ? parseFloat(e.target.value) : 0 })}
                  step="0.01"
                  min="0"
                  className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter area in km²"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Status *</label>
                <select
                  value={formData.status || 'active'}
                  onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                  className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="error">Error</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={formData.description || ''}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter zone description"
                  rows={3}
                />
              </div>

              {formData.altitudeRange && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Min Altitude (m)</label>
                      <input
                        type="number"
                        value={formData.altitudeRange?.min || ''}
                        onChange={e => setFormData({
                          ...formData,
                          altitudeRange: { min: e.target.value ? parseInt(e.target.value) : 0, max: formData.altitudeRange?.max || 5000 }
                        })}
                        className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Min altitude"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Max Altitude (m)</label>
                      <input
                        type="number"
                        value={formData.altitudeRange?.max || ''}
                        onChange={e => setFormData({
                          ...formData,
                          altitudeRange: { min: formData.altitudeRange?.min || 0, max: e.target.value ? parseInt(e.target.value) : 5000 }
                        })}
                        className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Max altitude"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="mt-8 flex space-x-4">
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={saveZone}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={saving || !formData.name?.trim() || !formData.area}
              >
                {saving ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Zone</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Zone Modal */}
      {showModal && modalType === 'deleteZone' && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-sm">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Delete Zone</h2>
            <p className="text-gray-600 mb-6 text-center">
              Are you sure you want to delete <strong>{selectedItem.name}</strong>? This action cannot be undone.
            </p>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            )}

            <div className="flex space-x-4">
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={deleteZone}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Zone</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Zones;
