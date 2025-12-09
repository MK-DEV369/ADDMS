import React, { useState } from 'react';
import {
  MapPin,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle
} from 'lucide-react';

// Type definitions
interface Zone {
  id: number;
  name: string;
  type: string;
  area: number;
  status: 'active' | 'maintenance' | 'error';
  deliveries?: number;
  violations?: number;
}

// Mock data for demonstration
const mockZones: Zone[] = [
  { id: 1, name: 'Downtown Area', type: 'operational', area: 12.5, status: 'active', deliveries: 1247 },
  { id: 2, name: 'Airport Vicinity', type: 'no-fly', area: 8.3, status: 'active', violations: 3 },
  { id: 3, name: 'Residential North', type: 'operational', area: 15.7, status: 'active', deliveries: 892 },
  { id: 4, name: 'Military Base', type: 'no-fly', area: 5.2, status: 'active', violations: 0 },
  { id: 5, name: 'Industrial Park', type: 'operational', area: 9.8, status: 'maintenance', deliveries: 0 },
];

const Zones = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedItem, setSelectedItem] = useState<Zone | null>(null);

  const openModal = (type: string, item: Zone | null = null) => {
    setModalType(type);
    setSelectedItem(item);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedItem(null);
  };

  // Filter functions
  const filteredZones = mockZones.filter(zone => {
    const matchesSearch = zone.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || zone.type === selectedStatus;
    return matchesSearch && matchesStatus;
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
            <option value="no-fly">No-Fly</option>
          </select>

          <button
            onClick={() => openModal('addZone')}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Add Zone</span>
          </button>
        </div>
      </div>

      {/* Zones Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredZones.map(zone => (
          <div key={zone.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
            <div className={`h-2 rounded-t-lg ${zone.type === 'operational' ? 'bg-green-500' : 'bg-red-500'}`} />
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{zone.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{zone.area} km²</p>
                </div>
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  zone.type === 'operational' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {zone.type}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Status:</span>
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    zone.status === 'active' ? 'bg-green-100 text-green-800' :
                    zone.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {zone.status}
                  </span>
                </div>
                {zone.type === 'operational' && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Deliveries:</span>
                    <span className="font-semibold text-gray-900">{zone.deliveries}</span>
                  </div>
                )}
                {zone.type === 'no-fly' && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Violations:</span>
                    <span className="font-semibold text-red-600">{zone.violations}</span>
                  </div>
                )}
              </div>

              <div className="flex space-x-2 pt-4 border-t border-gray-200">
                <button onClick={() => openModal('editZone', zone)} className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                  <Edit2 className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                <button onClick={() => openModal('deleteZone', zone)} className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors">
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {modalType === 'addZone' && 'Add New Zone'}
                {modalType === 'editZone' && 'Edit Zone'}
                {modalType === 'deleteZone' && 'Delete Zone'}
              </h3>

              {modalType === 'deleteZone' && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                    <p className="text-sm text-red-800">
                      Are you sure you want to delete this zone? This action cannot be undone.
                    </p>
                  </div>
                </div>
              )}

              {(modalType === 'addZone' || modalType === 'editZone') && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">Form fields would go here. This is a demonstration modal.</p>
                </div>
              )}

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                {modalType !== 'deleteZone' && (
                  <button
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Save
                  </button>
                )}
                {modalType === 'deleteZone' && (
                  <button
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Zones;
