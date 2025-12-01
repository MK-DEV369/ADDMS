/**
 * Customer Dashboard - Placeholder
 * 
 * TODO: Implement:
 * - Create delivery order form
 * - Live tracking of assigned drone on 3D map
 * - Order history
 * - ETA updates via WebSocket
 * - Notifications center
 */
export default function CustomerDashboard() {
  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Customer Dashboard</h1>
        <p className="text-gray-600 mb-4">
          This is a placeholder for the Customer Dashboard.
        </p>
        <div className="space-y-4">
          <div className="bg-purple-50 border border-purple-200 rounded p-4">
            <h3 className="font-semibold text-purple-900">To Implement:</h3>
            <ul className="list-disc list-inside text-purple-800 mt-2 space-y-1">
              <li>Create delivery order form (pickup/delivery locations, package details)</li>
              <li>Live drone tracking on 3D CesiumJS map</li>
              <li>Order history and status</li>
              <li>Real-time ETA updates via WebSocket</li>
              <li>Notifications center</li>
              <li>Route visualization on map</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

