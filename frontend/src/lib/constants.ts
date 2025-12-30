// Predefined pickup/drone locations across Bangalore
export const PICKUP_LOCATIONS = [
  {
    id: 1,
    name: 'Nagarbhavi',
    coordinates: { lat: 12.9700825, lng: 77.4899914 },
  },
  {
    id: 2,
    name: 'Indiranagar',
    coordinates: { lat: 12.9729594, lng: 77.6187275 },
  },
  {
    id: 3,
    name: 'Majestic',
    coordinates: { lat: 12.9773452, lng: 77.5660192 },
  },
  {
    id: 4,
    name: 'Bannerghatta',
    coordinates: { lat: 12.8129629, lng: 77.5702302 },
  },
  {
    id: 5,
    name: 'Hebbal',
    coordinates: { lat: 13.0346428, lng: 77.587862 },
  },
] as const;

// Calculate distance between two coordinates using Haversine formula (in km)
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Type for pickup location with distance
export type PickupLocationWithDistance = {
  id: number;
  name: string;
  coordinates: { lat: number; lng: number };
  distance: number;
};

// Find the nearest pickup location to given coordinates
export function findNearestPickupLocation(lat: number, lng: number): PickupLocationWithDistance {
  let nearestIndex = 0;
  let minDistance = calculateDistance(
    PICKUP_LOCATIONS[0].coordinates.lat,
    PICKUP_LOCATIONS[0].coordinates.lng,
    lat,
    lng
  );

  for (let i = 1; i < PICKUP_LOCATIONS.length; i++) {
    const location = PICKUP_LOCATIONS[i];
    const distance = calculateDistance(
      location.coordinates.lat,
      location.coordinates.lng,
      lat,
      lng
    );
    if (distance < minDistance) {
      minDistance = distance;
      nearestIndex = i;
    }
  }

  const nearest = PICKUP_LOCATIONS[nearestIndex];
  return { 
    id: nearest.id, 
    name: nearest.name, 
    coordinates: { lat: nearest.coordinates.lat, lng: nearest.coordinates.lng },
    distance: minDistance 
  };
}
