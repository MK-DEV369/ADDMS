"""
Static circular zones (red/yellow) for quick lookup by the backend and route optimizer.
- Red zones: treated as no-fly (hard avoid)
- Yellow zones: caution/advisory (soft avoid, but currently avoided like no-fly for safety)

Each zone is represented as a circle approximated by a polygon for spatial queries.
"""
import json
from math import sin, radians, degrees, asin, atan2, pi
from typing import List, Dict, Optional
from django.contrib.gis.geos import Polygon

# Earth radius in meters (WGS84)
EARTH_RADIUS_M = 6_378_137

# Base catalog of zones. Add/update as needed.
# radius_m: meters
STATIC_ZONES: List[Dict] = [
    {
        "name": "Red Zone - Airport",
        "severity": "red",
        "center": {"lat": 12.9716, "lng": 77.5946},
        "radius_m": 1_500,
        "altitude_min": 0,
        "altitude_max": 1200,
        "reason": "Airport critical airspace"
    },
    {
        "name": "Yellow Zone - Hospital Corridor",
        "severity": "yellow",
        "center": {"lat": 12.985, "lng": 77.61},
        "radius_m": 800,
        "altitude_min": 0,
        "altitude_max": 400,
        "reason": "Hospital helipad corridor"
    },
    {
        "name": "Red Zone - Sensitive Facility",
        "severity": "red",
        "center": {"lat": 13.01, "lng": 77.58},
        "radius_m": 1_000,
        "altitude_min": 0,
        "altitude_max": 800,
        "reason": "Government / sensitive facility"
    },
]


def _circle_to_polygon(lat: float, lng: float, radius_m: float, num_points: int = 64) -> Polygon:
    """Approximate a geodesic circle as a polygon (SRID 4326)."""
    lat_r = radians(lat)
    lng_r = radians(lng)
    angular_distance = radius_m / EARTH_RADIUS_M

    coords = []
    for i in range(num_points):
        bearing = 2 * pi * (i / num_points)
        sin_lat = sin(lat_r) * cos(angular_distance) + cos(lat_r) * sin(angular_distance) * cos(bearing)
        lat_p = asin(sin_lat)
        y = sin(bearing) * sin(angular_distance) * cos(lat_r)
        x = cos(angular_distance) - sin(lat_r) * sin_lat
        lng_p = lng_r + atan2(y, x)
        coords.append((degrees(lng_p), degrees(lat_p)))

    # Close ring
    coords.append(coords[0])
    return Polygon(coords, srid=4326)


def load_static_zones(bbox: Optional[Polygon] = None) -> List[Dict]:
    """
    Return static zones as geometry dictionaries; optionally filter by intersection with a bbox.
    Each dict contains: geometry, name, severity, altitude_min/max, reason.
    """
    zones = []
    for zone in STATIC_ZONES:
        center = zone["center"]
        poly = _circle_to_polygon(center["lat"], center["lng"], zone["radius_m"])

        if bbox and not poly.intersects(bbox):
            continue

        zones.append(
            {
                "geometry": poly,
                "name": zone["name"],
                "severity": zone["severity"],
                "altitude_min": zone.get("altitude_min", 0),
                "altitude_max": zone.get("altitude_max", 400),
                "reason": zone.get("reason", "static_zone"),
            }
        )
    return zones


def export_static_zones_geojson() -> List[Dict]:
    """Utility to export static zones as GeoJSON Feature list (not written to disk here)."""
    features: List[Dict] = []
    for zone in STATIC_ZONES:
        poly = _circle_to_polygon(zone["center"]["lat"], zone["center"]["lng"], zone["radius_m"])
        features.append(
            {
                "type": "Feature",
                "properties": {
                    "name": zone["name"],
                    "severity": zone["severity"],
                    "reason": zone.get("reason", "static_zone"),
                    "altitude_min": zone.get("altitude_min", 0),
                    "altitude_max": zone.get("altitude_max", 400),
                    "radius_m": zone["radius_m"],
                },
                "geometry": json.loads(poly.geojson),
            }
        )
    return features
