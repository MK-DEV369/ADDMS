import React, { useState, useEffect } from 'react';
import {
  Plane,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  Battery,
  Activity,
  Settings,
  AlertTriangle,
  MapPin
} from 'lucide-react';
import api, { getDrones, addDrone, updateDrone, deleteDrone } from '@/lib/api';
import { Drone } from '@/lib/types';
import { PICKUP_LOCATIONS } from '@/lib/constants';

const Drones = () => {
  const [drones, setDrones] = useState<Drone[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedItem, setSelectedItem] = useState<Drone | null>(null);
  const [newDrone, setNewDrone] = useState<Partial<Drone>>({
    serial_number: '',
    model: '',
    manufacturer: '',
    max_payload_weight: 0,
    max_speed: 0,
    max_altitude: 0,
    max_range: 0,
    battery_capacity: 0,
    locationId: undefined,
  });

  useEffect(() => {
    fetchDrones();
  }, []);

  const fetchDrones = async () => {
    try {
      const response = await getDrones();
      const payload = response.data
      const results = Array.isArray(payload) ? payload : Array.isArray(payload?.results) ? payload.results : []
      setDrones(results);
    } catch (error) {
      console.error('Failed to fetch drones', error);
    }
  };

  const handleAddDrone = async () => {
    try {
      const selectedLocation = PICKUP_LOCATIONS.find(loc => loc.id === (newDrone as any).locationId);
      
      const payload = {
        serial_number: newDrone.serial_number,
        model: newDrone.model,
        manufacturer: newDrone.manufacturer,
        max_payload_weight: Number(newDrone.max_payload_weight) || 0,
        max_speed: Number(newDrone.max_speed) || 0,
        max_altitude: Number(newDrone.max_altitude) || 0,
        max_range: Number(newDrone.max_range) || 0,
        battery_capacity: Number(newDrone.battery_capacity) || 0,
        status: newDrone.status || 'idle',
        notes: (newDrone as any).notes || '',
        is_active: typeof newDrone.is_active === 'boolean' ? newDrone.is_active : true,
        // Add location data if selected
        ...(selectedLocation && {
          current_position_lat: selectedLocation.coordinates.lat,
          current_position_lng: selectedLocation.coordinates.lng,
          home_base: selectedLocation.name,
        }),
      }
      console.debug('[Drones] add payload', payload)
      const resp = await addDrone(payload as Drone);
      console.debug('[Drones] add response', resp)
      await fetchDrones();
      closeModal();
    } catch (error) {
    console.error('Failed to add drone', error);
    let errorMessage = '';
    if ((error as any).response) {
      console.error('server response data:', (error as any).response.data);
      errorMessage = (error as any).response.data.battery_capacity || 'An unknown error occurred';
    } else {
      errorMessage = 'An unexpected error occurred. Please try again later.';
    }
    alert(errorMessage);
    console.error('Full error details:', error);
    }
  };

  const handleUpdateDrone = async () => {
    try {
      if (!newDrone.id) return
      const selectedLocation = PICKUP_LOCATIONS.find(loc => loc.id === (newDrone as any).locationId);
      
      const payload: Partial<Drone> = {
        serial_number: newDrone.serial_number,
        model: newDrone.model,
        manufacturer: newDrone.manufacturer,
        max_payload_weight: newDrone.max_payload_weight,
        max_speed: newDrone.max_speed,
        max_altitude: newDrone.max_altitude,
        max_range: newDrone.max_range,
        battery_capacity: newDrone.battery_capacity,
        status: newDrone.status,
        // Add location data if selected
        ...(selectedLocation && {
          current_position_lat: selectedLocation.coordinates.lat,
          current_position_lng: selectedLocation.coordinates.lng,
          home_base: selectedLocation.name,
        }),
      };
      
      await updateDrone(newDrone.id, payload)
      await fetchDrones()
      closeModal()
    } catch (err) {
      console.error('Failed to update drone', err)
    }
  }

  const handleDeleteDrone = async () => {
    try {
      if (!selectedItem || !selectedItem.id) return
      if (!confirm(`Delete drone ${selectedItem.serial_number}?`)) return
      await deleteDrone(selectedItem.id)
      await fetchDrones()
      closeModal()
    } catch (err) {
      console.error('Failed to delete drone', err)
    }
  }

  const getStatusColor = (status?: string) => {
    const colors: Record<string, string> = {
      idle: 'bg-blue-100 text-blue-800',
      charging: 'bg-yellow-100 text-yellow-800',
      assigned: 'bg-purple-100 text-purple-800',
      delivering: 'bg-orange-100 text-orange-800',
      returning: 'bg-indigo-100 text-indigo-800',
      maintenance: 'bg-red-100 text-red-800',
      offline: 'bg-gray-100 text-gray-800',
    };
    return colors[status || 'idle'] || colors.idle;
  };

  const getBatteryColor = (level: number) => {
    if (level > 60) return 'text-green-600';
    if (level > 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  const openModal = (type: string, item: Drone | null = null) => {
    setModalType(type);
    setSelectedItem(item);
    if (item) {
      // Extract location from notes if it exists
      let locationId = undefined;
      if (item.home_base) {
        const location = PICKUP_LOCATIONS.find(loc => loc.name === item.home_base);
        locationId = location?.id;
      }
      
      setNewDrone({
        id: item.id,
        serial_number: item.serial_number,
        model: item.model,
        manufacturer: item.manufacturer,
        max_payload_weight: item.max_payload_weight,
        max_speed: item.max_speed,
        max_altitude: item.max_altitude,
        max_range: item.max_range,
        battery_capacity: item.battery_capacity,
        status: item.status,
        locationId: locationId,
        home_base: item.home_base,
      })
    } else {
      setNewDrone({
        serial_number: '',
        model: '',
        manufacturer: '',
        max_payload_weight: 0,
        max_speed: 0,
        max_altitude: 0,
        max_range: 0,
        battery_capacity: 0,
        locationId: undefined,
      })
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedItem(null);
  };

const filteredDrones = Array.isArray(drones) 
  ? drones.filter(drone => {
      const matchesSearch = drone.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            drone.model.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = selectedStatus === 'all' || drone.status === selectedStatus;
      return matchesSearch && matchesStatus;
    })
  : [];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Drones</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{drones.length}</p>
            </div>
            <Plane className="w-10 h-10 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Active Now</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{filteredDrones.filter(d => ['assigned', 'delivering', 'returning'].includes(d.status || '')).length}</p>
            </div>
            <Activity className="w-10 h-10 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Avg Battery</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {drones.length > 0 
                  ? Math.round(
                    drones.reduce((acc, d) => acc + (d.battery_level ?? 0), 0) / drones.length
                  ) : 0}%
              </p>
            </div>
            <Battery className={`w-10 h-10 ${getBatteryColor(drones.length > 0 ? Math.round(drones.reduce((acc, d) => acc + (d.battery_level ?? 0), 0) / drones.length) : 0)}`} />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Maintenance</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">
                {filteredDrones.filter(d => d.status === 'maintenance').length}
              </p>
            </div>
            <Settings className="w-10 h-10 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by ID or model..."
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
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="idle">Idle</option>
            <option value="maintenance">Maintenance</option>
          </select>

          <button
            onClick={() => openModal('addDrone')}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Add Drone</span>
          </button>
        </div>
      </div>

      {/* Drones Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Battery</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Update</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredDrones.map(drone => (
              <tr key={drone.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{drone.serial_number}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{drone.model}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(drone?.status ?? 'idle')}`}>
                    {drone.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-gray-400" />
                    {drone.home_base || '—'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex items-center space-x-2"> 
                    <Battery 
                      className={`w-4 h-4 ${getBatteryColor(drone.battery_level ?? 0)}`}
                    />
                    <span className={`font-medium ${getBatteryColor(drone.battery_level ?? 0)}`}> {drone.battery_level ?? 0}% </span>
                  </div>
                </td>
                {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{drone.current_position_lat}, {drone.current_position_lng}</td> /drones/drones/{id} */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{drone.last_heartbeat}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex space-x-2">
                    <button onClick={() => openModal('viewDrone', drone)} className="text-blue-600 hover:text-blue-800">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => openModal('editDrone', drone)} className="text-green-600 hover:text-green-800">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => openModal('deleteDrone', drone)} className="text-red-600 hover:text-red-800">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {modalType === 'addDrone' && 'Add New Drone'}
                {modalType === 'editDrone' && 'Edit Drone'}
                {modalType === 'deleteDrone' && 'Delete Drone'}
                {modalType === 'viewDrone' && 'Drone Details'}
              </h3>
            </div>

            {/* Content - Scrollable */}
            <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
              {modalType === 'viewDrone' && selectedItem && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Drone ID</p>
                      <p className="font-semibold text-gray-900">{selectedItem.serial_number}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Model</p>
                      <p className="font-semibold text-gray-900">{selectedItem.model}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedItem?.status ?? 'idle')}`}>
                        {selectedItem?.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Battery</p>
                      <p className={`font-semibold ${getBatteryColor(selectedItem.battery_level ?? 0)}`}>{selectedItem.battery_level ?? 0}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Base Location</p>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <p className="font-semibold text-gray-900">{selectedItem.home_base || '—'}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Max Payload</p>
                      <p className="font-semibold text-gray-900">{selectedItem.max_payload_weight} kg</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Last Update</p>
                      <p className="font-semibold text-gray-900">{selectedItem.last_heartbeat}</p>
                    </div>
                  </div>
                </div>
              )}

              {modalType === 'deleteDrone' && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                    <p className="text-sm text-red-800">
                      Are you sure you want to delete this drone? This action cannot be undone.
                    </p>
                  </div>
                </div>
              )}

              {(modalType === 'addDrone' || modalType === 'editDrone') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number *</label>
                    <input
                      type="text"
                      value={newDrone.serial_number}
                      onChange={(e) => setNewDrone({ ...newDrone, serial_number: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Model *</label>
                    <input
                      type="text"
                      value={newDrone.model}
                      onChange={(e) => setNewDrone({ ...newDrone, model: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
                    <input
                      type="text"
                      value={newDrone.manufacturer}
                      onChange={(e) => setNewDrone({ ...newDrone, manufacturer: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Payload (kg)</label>
                    <input
                      type="number"
                      value={newDrone.max_payload_weight}
                      onChange={(e) => setNewDrone({ ...newDrone, max_payload_weight: Number(e.target.value) })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Speed (km/h)</label>
                    <input
                      type="number"
                      value={newDrone.max_speed}
                      onChange={(e) => setNewDrone({ ...newDrone, max_speed: Number(e.target.value) })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Altitude (m)</label>
                    <input
                      type="number"
                      value={newDrone.max_altitude}
                      onChange={(e) => setNewDrone({ ...newDrone, max_altitude: Number(e.target.value) })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Range (km)</label>
                    <input
                      type="number"
                      value={newDrone.max_range}
                      onChange={(e) => setNewDrone({ ...newDrone, max_range: Number(e.target.value) })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Battery Capacity (mAh)</label>
                    <input
                      type="number"
                      value={newDrone.battery_capacity}
                      onChange={(e) => setNewDrone({ ...newDrone, battery_capacity: Number(e.target.value) })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      Home Base Location {modalType === 'addDrone' && '*'}
                    </label>
                    <select
                      value={(newDrone as any).locationId || ''}
                      onChange={(e) => setNewDrone({ ...newDrone, locationId: Number(e.target.value) } as any)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required={modalType === 'addDrone'}
                    >
                      <option value="">Select a location...</option>
                      {PICKUP_LOCATIONS.map((location) => (
                        <option key={location.id} value={location.id}>
                          {location.name} ({location.coordinates.lat.toFixed(4)}, {location.coordinates.lng.toFixed(4)})
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      This sets the drone's initial position and home base
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer - Always visible */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <div className="flex space-x-3">
                <button
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors font-medium"
                >
                  {modalType === 'viewDrone' ? 'Close' : 'Cancel'}
                </button>
                {modalType !== 'viewDrone' && (
                  <button
                    onClick={
                      modalType === 'addDrone' ? handleAddDrone : 
                      modalType === 'editDrone' ? handleUpdateDrone : 
                      modalType === 'deleteDrone' ? handleDeleteDrone : closeModal
                    }
                    className={`flex-1 px-4 py-2 rounded-lg text-white transition-colors font-medium ${
                      modalType === 'deleteDrone'
                        ? 'bg-red-600 hover:bg-red-700'
                        : modalType === 'editDrone' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {modalType === 'deleteDrone' ? 'Delete' : modalType === 'editDrone' ? 'Update' : 'Save'}
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

export default Drones;
