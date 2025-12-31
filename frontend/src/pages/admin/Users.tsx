import { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { getUsers, addUser, deleteUser as apiDeleteUser, updateUser as apiUpdateUser } from '@/lib/api'
import { User } from '@/lib/types';

const UsersPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedItem, setSelectedItem] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)

  // form state for add/edit
  const [formUsername, setFormUsername] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formRole, setFormRole] = useState<'admin' | 'manager' | 'customer'>('customer')
  const [formStatus, setFormStatus] = useState<'active'|'inactive'>('active')

  // Debug helper
  const dbg = (...args:any[]) => console.debug('[UsersPage]', ...args)

  useEffect(() => {
    dbg('Mounting UsersPage - starting fetch')
    fetchAllUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchAllUsers = async () => {
    dbg('fetchAllUsers: begin')
    setLoading(true)
    try {
      const resp = await getUsers()
      dbg('fetchAllUsers: response', resp)
      const payload = resp.data
      dbg('fetchAllUsers: payload', payload)
      const results = Array.isArray(payload) ? payload : Array.isArray(payload?.results) ? payload.results : []
      setUsers(results)
      dbg('fetchAllUsers: stored users count', results.length)
    } catch (err:any) {
      dbg('fetchAllUsers: error', err)
    } finally {
      setLoading(false)
      dbg('fetchAllUsers: finished')
    }
  }

  const openModal = (type: string, item: User | null = null) => {
    dbg('openModal', type, item)
    setModalType(type);
    setSelectedItem(item);
    if (item) {
      setFormUsername(item.username)
      setFormEmail(item.email || '')
      setFormRole(item.role)
      setFormStatus(item.is_active ? 'active' : 'inactive')
    } else {
      setFormUsername('')
      setFormEmail('')
      setFormRole('customer')
      setFormStatus('active')
    }
    setShowModal(true);
  };

  const closeModal = () => {
    dbg('closeModal')
    setShowModal(false);
    setSelectedItem(null);
  };

  const handleSaveUser = async () => {
    dbg('handleSaveUser: modalType', modalType, 'selectedItem', selectedItem)
    // basic validation
    if (!formUsername || !formEmail) {
      dbg('handleSaveUser: validation failed', { formUsername, formEmail })
      alert('Please provide username and email')
      return
    }

    const payload = { username: formUsername, email: formEmail, role: formRole, is_active: formStatus === 'active' }
    dbg('handleSaveUser: payload', payload)
    try {
      if (modalType === 'addUser') {
        dbg('handleSaveUser: calling addUser API')
        const resp = await addUser(payload)
        dbg('handleSaveUser: addUser response', resp)
        // optimistic update: push created user if returned
        const created = resp.data
        if (created && created.id) {
          setUsers(prev => [created, ...prev])
          dbg('handleSaveUser: prepended created user id', created.id)
        } else {
          // fallback: re-fetch
          dbg('handleSaveUser: no created id returned, refetching users')
          await fetchAllUsers()
        }
      } else if (modalType === 'editUser' && selectedItem && selectedItem.id) {
        dbg('handleSaveUser: calling updateUser API for id', selectedItem.id)
        const resp = await apiUpdateUser(selectedItem.id, payload)
        dbg('handleSaveUser: updateUser response', resp)
        // update local state
        setUsers(prev => prev.map(u => (u.id === selectedItem.id ? { ...u, ...payload } : u)))
      }
      closeModal()
    } catch (err:any) {
      dbg('handleSaveUser: error', err)
      alert('Failed to save user: ' + (err?.message || 'unknown'))
    }
  }

  const handleDeleteUser = async (user: User) => {
    if (!user.id) return
    const ok = confirm(`Delete user ${user.username}?`)
    if (!ok) return
    dbg('handleDeleteUser: deleting id', user.id)
    try {
      const resp = await apiDeleteUser(user.id)
      dbg('handleDeleteUser: response', resp)
      setUsers(prev => prev.filter(u => u.id !== user.id))
    } catch (err:any) {
      dbg('handleDeleteUser: error', err)
      alert('Delete failed: ' + (err?.message || 'unknown'))
    }
  }

  // Filter functions
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    return matchesSearch && matchesRole;
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
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="customer">Customer</option>
          </select>

          <button
            onClick={() => openModal('addUser')}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading && (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-sm text-gray-500">Loading users...</td>
              </tr>
            )}
            {!loading && filteredUsers.map(user => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {user.username.split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{user.username}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email || ''}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                    user.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.is_active ? 'active' : 'inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex space-x-2">
                    <button onClick={() => openModal('editUser', user)} className="text-green-600 hover:text-green-800">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteUser(user)} className="text-red-600 hover:text-red-800">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {modalType === 'addUser' && 'Add New User'}
                {modalType === 'editUser' && 'Edit User'}
                {modalType === 'deleteUser' && 'Delete User'}
              </h3>

              {modalType === 'deleteUser' && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                    <p className="text-sm text-red-800">
                      Are you sure you want to delete this user? This action cannot be undone.
                    </p>
                  </div>
                </div>
              )}

              {(modalType === 'addUser' || modalType === 'editUser') && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Username</label>
                    <input value={formUsername} onChange={e => setFormUsername(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <input value={formEmail} onChange={e => setFormEmail(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Role</label>
                    <select value={formRole} onChange={e => setFormRole(e.target.value as 'admin' | 'manager' | 'customer')} className="w-full mt-1 px-3 py-2 border rounded-lg">
                      <option value="admin">admin</option>
                      <option value="manager">manager</option>
                      <option value="customer">customer</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <select value={formStatus} onChange={e => setFormStatus(e.target.value as any)} className="w-full mt-1 px-3 py-2 border rounded-lg">
                      <option value="active">active</option>
                      <option value="inactive">inactive</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="flex space-x-3 mt-6">
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                {modalType === 'addUser' && (
                  <button onClick={handleSaveUser} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Save</button>
                )}
                {modalType === 'editUser' && (
                  <button onClick={handleSaveUser} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">Update</button>
                )}
                {modalType === 'deleteUser' && (
                  <button
                    onClick={() => { if (selectedItem) handleDeleteUser(selectedItem); closeModal() }}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
