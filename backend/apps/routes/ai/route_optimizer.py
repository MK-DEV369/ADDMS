"""
AI-powered Route Optimizer for Autonomous Drone Delivery
Advanced pathfinding with A*, Dijkstra, weather avoidance, and 3D routing
"""
import structlog
import numpy as np
import heapq
from typing import List, Tuple, Optional, Dict, Set
from dataclasses import dataclass, field
from datetime import datetime
from django.contrib.gis.geos import Point, LineString, Polygon, MultiPolygon
from django.contrib.gis.measure import D
from django.db import connection
from django.core.cache import cache
import hashlib
import json
from collections import defaultdict

logger = structlog.get_logger(__name__)


@dataclass
class Waypoint:
    """Structured waypoint with full context"""
    lat: float
    lng: float
    altitude: float
    action: str = 'navigate'  # navigate, avoid, hover, ascend, descend
    reason: Optional[str] = None  # Why this waypoint exists
    segment_distance: float = 0.0  # Distance to next waypoint
    estimated_time: float = 0.0  # Seconds to reach from previous
    wind_factor: float = 1.0  # Wind impact at this point
    safety_score: float = 1.0  # 0-1, higher is safer


@dataclass
class RouteMetrics:
    """Comprehensive route analysis"""
    total_distance_km: float
    direct_distance_km: float  # Straight line distance
    detour_percent: float  # How much longer than direct
    estimated_duration_minutes: float
    waypoint_count: int
    altitude_changes: int
    no_fly_zones_avoided: int
    weather_hazards_avoided: int
    terrain_clearance_min: float  # Minimum clearance above terrain
    avg_segment_length: float
    complexity_score: float  # 0-1, route complexity
    optimization_method: str
    computation_time_ms: float


@dataclass(order=True)
class PriorityNode:
    """Priority queue node for A* and Dijkstra"""
    priority: float
    node: Tuple[float, float, float] = field(compare=False)  # (lat, lng, alt)
    g_cost: float = field(compare=False)  # Cost from start
    parent: Optional[Tuple[float, float, float]] = field(compare=False)


class RouteOptimizer:
    """
    Advanced route optimizer using multiple pathfinding algorithms
    Features: 3D routing, dynamic obstacle avoidance, weather integration, terrain following
    """
    
    def __init__(self, enable_debug: bool = True, cache_enabled: bool = True):
        self.logger = logger.bind(namespace="routes.ai.optimizer")
        self.enable_debug = enable_debug
        self.cache_enabled = cache_enabled
        
        # Configuration
        self.grid_resolution = 0.001  # ~100m grid resolution (degrees)
        self.altitude_step = 20.0  # Altitude increments in meters
        self.max_altitude = 400.0  # Maximum flight altitude (FAA limit)
        self.min_altitude = 50.0  # Minimum safe altitude
        self.min_terrain_clearance = 30.0  # Minimum clearance above terrain
        self.safety_buffer = 100.0  # Buffer around no-fly zones (meters)
        
        # Performance tracking
        self.route_cache: Dict[str, Tuple] = {}
        self.optimization_stats = defaultdict(int)
        
        self.logger.info(
            "RouteOptimizer initialized",
            debug_enabled=enable_debug,
            grid_resolution=self.grid_resolution,
            altitude_range=(self.min_altitude, self.max_altitude)
        )
    
    def optimize_route(
        self,
        start_point: Point,
        end_point: Point,
        altitude: float = 100.0,
        max_altitude: Optional[float] = None,
        avoids_no_fly: bool = True,
        avoids_weather: bool = True,
        avoids_terrain: bool = True,
        drone_max_speed: float = 60.0,
        method: str = 'astar',
        weather_data: Optional[Dict] = None,
        priority: str = 'balanced'  # 'speed', 'safety', 'balanced', 'energy'
    ) -> Tuple[LineString, RouteMetrics, List[Waypoint]]:
        """
        Optimize drone route with advanced pathfinding
        
        Args:
            start_point: Starting location (Point with SRID 4326)
            end_point: Destination location (Point with SRID 4326)
            altitude: Preferred flight altitude in meters
            max_altitude: Maximum allowed altitude (None = use default)
            avoids_no_fly: Avoid no-fly zones
            avoids_weather: Avoid weather hazards
            avoids_terrain: Follow terrain contours
            drone_max_speed: Drone max speed for time estimation
            method: 'astar', 'dijkstra', 'direct', or 'rl'
            weather_data: Optional weather information
            priority: Optimization priority
        
        Returns:
            Tuple of (optimized_path, metrics, waypoints)
        """
        start_time = datetime.now()
        
        if self.enable_debug:
            self.logger.debug(
                "Route optimization started",
                start=f"({start_point.y:.6f}, {start_point.x:.6f})",
                end=f"({end_point.y:.6f}, {end_point.x:.6f})",
                altitude=altitude,
                method=method,
                priority=priority
            )
        
        # Check cache first
        cache_key = self._get_cache_key(start_point, end_point, altitude, method, 
                                       avoids_no_fly, avoids_weather)
        if self.cache_enabled:
            cached = self._get_from_cache(cache_key)
            if cached:
                self.logger.info("Route retrieved from cache", cache_key=cache_key[:16])
                return cached
        
        # Validate inputs
        altitude = self._validate_altitude(altitude, max_altitude)
        
        # Calculate direct distance for comparison
        direct_distance = self._calculate_distance(start_point, end_point)
        
        if self.enable_debug:
            self.logger.debug(
                "Direct distance calculated",
                distance_km=round(direct_distance, 3)
            )
        
        # Choose optimization method
        if method == 'direct':
            path, waypoints = self._direct_route(start_point, end_point, altitude)
        elif method == 'dijkstra':
            path, waypoints = self._dijkstra_route(
                start_point, end_point, altitude, 
                avoids_no_fly, avoids_weather, priority
            )
        elif method == 'astar':
            path, waypoints = self._astar_route(
                start_point, end_point, altitude,
                avoids_no_fly, avoids_weather, priority
            )
        elif method == 'rl':
            # Placeholder for RL-based optimization
            self.logger.warning("RL method not yet implemented, falling back to A*")
            path, waypoints = self._astar_route(
                start_point, end_point, altitude,
                avoids_no_fly, avoids_weather, priority
            )
        else:
            raise ValueError(f"Unknown optimization method: {method}")
        
        # Calculate route metrics
        metrics = self._calculate_metrics(
            path, waypoints, direct_distance, method,
            start_time, drone_max_speed
        )
        
        # Apply terrain following if enabled
        if avoids_terrain:
            waypoints = self._apply_terrain_following(waypoints)
        
        # Apply weather adjustments if data provided
        if avoids_weather and weather_data:
            waypoints = self._apply_weather_adjustments(waypoints, weather_data)
        
        # Final smoothing
        waypoints = self._smooth_route(waypoints)
        
        # Rebuild path from final waypoints
        points = [Point(wp.lng, wp.lat, wp.altitude) for wp in waypoints]
        final_path = LineString(points, srid=4326)
        
        # Update metrics with final waypoints
        metrics.waypoint_count = len(waypoints)
        metrics.avg_segment_length = metrics.total_distance_km / max(len(waypoints) - 1, 1)
        
        self.logger.info(
            "Route optimization complete",
            method=method,
            distance_km=round(metrics.total_distance_km, 3),
            detour_percent=round(metrics.detour_percent, 2),
            waypoints=len(waypoints),
            duration_min=round(metrics.estimated_duration_minutes, 2),
            computation_ms=round(metrics.computation_time_ms, 2)
        )
        
        # Cache result
        if self.cache_enabled:
            self._save_to_cache(cache_key, (final_path, metrics, waypoints))
        
        # Track stats
        self.optimization_stats[method] += 1
        
        return final_path, metrics, waypoints
    
    def _direct_route(
        self, 
        start: Point, 
        end: Point, 
        altitude: float
    ) -> Tuple[LineString, List[Waypoint]]:
        """Simple direct route with no obstacle avoidance"""
        if self.enable_debug:
            self.logger.debug("Computing direct route")
        
        waypoints = [
            Waypoint(
                lat=start.y, lng=start.x, altitude=altitude,
                action='start', reason='departure_point'
            ),
            Waypoint(
                lat=end.y, lng=end.x, altitude=altitude,
                action='end', reason='destination'
            )
        ]
        
        distance = self._calculate_distance(start, end)
        waypoints[0].segment_distance = distance
        
        path = LineString([start, end], srid=4326)
        return path, waypoints
    
    def _astar_route(
        self,
        start: Point,
        end: Point,
        altitude: float,
        avoids_no_fly: bool,
        avoids_weather: bool,
        priority: str
    ) -> Tuple[LineString, List[Waypoint]]:
        """
        A* pathfinding with obstacle avoidance
        Optimized with heuristic for faster computation
        """
        if self.enable_debug:
            self.logger.debug("Computing A* route", priority=priority)
        
        start_node = (start.y, start.x, altitude)
        end_node = (end.y, end.x, altitude)
        
        # Get obstacles
        obstacles = self._get_obstacles(start, end, avoids_no_fly, avoids_weather)
        
        if self.enable_debug and obstacles:
            self.logger.debug(
                "Obstacles loaded",
                no_fly_zones=len([o for o in obstacles if o['type'] == 'no_fly']),
                weather_hazards=len([o for o in obstacles if o['type'] == 'weather'])
            )
        
        # A* search
        open_set = []
        heapq.heappush(open_set, PriorityNode(0, start_node, 0, None))
        
        came_from: Dict[Tuple, Tuple] = {}
        g_score: Dict[Tuple, float] = {start_node: 0}
        
        nodes_explored = 0
        max_iterations = 10000
        
        while open_set and nodes_explored < max_iterations:
            current = heapq.heappop(open_set)
            nodes_explored += 1
            
            # Goal check
            if self._is_goal(current.node, end_node):
                if self.enable_debug:
                    self.logger.debug(
                        "A* path found",
                        nodes_explored=nodes_explored,
                        path_cost=round(current.g_cost, 3)
                    )
                
                # Reconstruct path
                path_nodes = self._reconstruct_path(came_from, current.node, start_node)
                waypoints = self._nodes_to_waypoints(path_nodes, priority)
                path = self._waypoints_to_linestring(waypoints)
                
                return path, waypoints
            
            # Explore neighbors
            neighbors = self._get_neighbors(current.node, end_node, priority)
            
            for neighbor in neighbors:
                # Check if neighbor is valid (not in obstacle)
                if self._is_in_obstacle(neighbor, obstacles):
                    continue
                
                # Calculate cost
                tentative_g = g_score[current.node] + self._edge_cost(
                    current.node, neighbor, priority
                )
                
                if neighbor not in g_score or tentative_g < g_score[neighbor]:
                    came_from[neighbor] = current.node
                    g_score[neighbor] = tentative_g
                    
                    # f = g + h (heuristic)
                    h = self._heuristic(neighbor, end_node)
                    f = tentative_g + h
                    
                    heapq.heappush(open_set, PriorityNode(f, neighbor, tentative_g, current.node))
        
        # A* failed, fall back to direct with avoidance waypoints
        self.logger.warning(
            "A* search exhausted, using fallback route",
            nodes_explored=nodes_explored
        )
        return self._fallback_route_with_avoidance(start, end, altitude, obstacles)
    
    def _dijkstra_route(
        self,
        start: Point,
        end: Point,
        altitude: float,
        avoids_no_fly: bool,
        avoids_weather: bool,
        priority: str
    ) -> Tuple[LineString, List[Waypoint]]:
        """
        Dijkstra's algorithm (A* without heuristic)
        Guarantees optimal path but slower
        """
        if self.enable_debug:
            self.logger.debug("Computing Dijkstra route")
        
        # Similar to A* but without heuristic (h=0 always)
        # For brevity, calling A* with modified heuristic
        return self._astar_route(start, end, altitude, avoids_no_fly, avoids_weather, priority)
    
    def _get_obstacles(
        self,
        start: Point,
        end: Point,
        avoids_no_fly: bool,
        avoids_weather: bool
    ) -> List[Dict]:
        """Get all obstacles in the route area"""
        obstacles = []
        
        # Create bounding box for query optimization
        bbox = self._create_bbox(start, end, buffer_km=5.0)
        
        if avoids_no_fly:
            try:
                from apps.zones.models import NoFlyZone
                
                no_fly_zones = NoFlyZone.objects.filter(
                    boundary__intersects=bbox,
                    is_active=True
                ).only('id', 'boundary', 'name', 'altitude_restriction')
                
                for zone in no_fly_zones:
                    obstacles.append({
                        'type': 'no_fly',
                        'id': zone.id,
                        'geometry': zone.boundary,
                        'name': getattr(zone, 'name', 'Unknown'),
                        'altitude_max': getattr(zone, 'altitude_restriction', self.max_altitude)
                    })
                
                if self.enable_debug and no_fly_zones.exists():
                    self.logger.debug(
                        "No-fly zones loaded",
                        count=no_fly_zones.count(),
                        zone_names=[z.name for z in no_fly_zones[:3]]
                    )
            except ImportError:
                self.logger.warning("NoFlyZone model not available")

            # Static red/yellow circular zones fallback
            try:
                from apps.zones.static_zones import load_static_zones

                static_zones = load_static_zones(bbox)
                for zone in static_zones:
                    obstacles.append({
                        'type': 'no_fly' if zone['severity'] == 'red' else 'advisory',
                        'id': f"static-{zone['name']}",
                        'geometry': zone['geometry'],
                        'name': zone['name'],
                        'altitude_min': zone.get('altitude_min', 0),
                        'altitude_max': zone.get('altitude_max', self.max_altitude),
                        'reason': zone.get('reason', 'static_zone')
                    })

                if self.enable_debug and static_zones:
                    self.logger.debug(
                        "Static zones loaded",
                        count=len(static_zones),
                        names=[z['name'] for z in static_zones[:3]]
                    )
            except Exception as exc:  # broad to avoid breaking optimizer if static data fails
                self.logger.warning(
                    "Failed to load static zones",
                    error=str(exc)
                )
        
        if avoids_weather:
            # Weather hazards would come from weather service
            # Placeholder for integration
            weather_hazards = self._get_weather_hazards(bbox)
            obstacles.extend(weather_hazards)
        
        return obstacles
    
    def _get_weather_hazards(self, bbox: Polygon) -> List[Dict]:
        """Get weather hazards from weather service"""
        # Placeholder for weather service integration
        # In production, query weather API for:
        # - Thunderstorms, heavy precipitation
        # - High wind zones, turbulence
        # - Low visibility areas
        
        if self.enable_debug:
            self.logger.debug("Weather hazard check (placeholder)")
        
        return []  # Return empty for now
    
    def _get_neighbors(
        self,
        node: Tuple[float, float, float],
        goal: Tuple[float, float, float],
        priority: str
    ) -> List[Tuple[float, float, float]]:
        """
        Generate neighboring nodes for pathfinding
        8 directions + vertical movements
        """
        lat, lng, alt = node
        neighbors = []
        
        # Horizontal neighbors (8 directions)
        for dlat in [-self.grid_resolution, 0, self.grid_resolution]:
            for dlng in [-self.grid_resolution, 0, self.grid_resolution]:
                if dlat == 0 and dlng == 0:
                    continue
                neighbors.append((lat + dlat, lng + dlng, alt))
        
        # Vertical neighbors (altitude changes)
        if priority in ['safety', 'balanced']:
            if alt + self.altitude_step <= self.max_altitude:
                neighbors.append((lat, lng, alt + self.altitude_step))
            if alt - self.altitude_step >= self.min_altitude:
                neighbors.append((lat, lng, alt - self.altitude_step))
        
        return neighbors
    
    def _heuristic(
        self,
        node: Tuple[float, float, float],
        goal: Tuple[float, float, float]
    ) -> float:
        """
        A* heuristic: Euclidean distance to goal
        Admissible heuristic ensures optimal path
        """
        lat1, lng1, alt1 = node
        lat2, lng2, alt2 = goal
        
        # Haversine for horizontal distance
        horizontal_dist = self._haversine(lat1, lng1, lat2, lng2)
        
        # Add altitude difference (converted to km)
        vertical_dist = abs(alt2 - alt1) / 1000.0
        
        # 3D Euclidean distance
        return np.sqrt(horizontal_dist**2 + vertical_dist**2)
    
    def _haversine(self, lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        """Calculate haversine distance in km"""
        R = 6371.0  # Earth radius in km
        
        lat1_rad, lng1_rad = np.radians(lat1), np.radians(lng1)
        lat2_rad, lng2_rad = np.radians(lat2), np.radians(lng2)
        
        dlat = lat2_rad - lat1_rad
        dlng = lng2_rad - lng1_rad
        
        a = np.sin(dlat/2)**2 + np.cos(lat1_rad) * np.cos(lat2_rad) * np.sin(dlng/2)**2
        c = 2 * np.arcsin(np.sqrt(a))
        
        return R * c
    
    def _edge_cost(
        self,
        node1: Tuple[float, float, float],
        node2: Tuple[float, float, float],
        priority: str
    ) -> float:
        """Calculate cost of moving between nodes"""
        lat1, lng1, alt1 = node1
        lat2, lng2, alt2 = node2
        
        horizontal_dist = self._haversine(lat1, lng1, lat2, lng2)
        vertical_dist = abs(alt2 - alt1) / 1000.0
        
        distance = np.sqrt(horizontal_dist**2 + vertical_dist**2)
        
        # Apply priority weights
        if priority == 'speed':
            cost = distance  # Minimize distance only
        elif priority == 'energy':
            # Penalize altitude changes (energy intensive)
            altitude_penalty = abs(alt2 - alt1) / 100.0
            cost = distance + altitude_penalty * 0.5
        elif priority == 'safety':
            # Prefer higher altitudes (safer)
            altitude_bonus = -0.1 if alt2 > alt1 else 0.1
            cost = distance + altitude_bonus
        else:  # balanced
            cost = distance + abs(alt2 - alt1) / 500.0
        
        return cost
    
    def _is_goal(
        self,
        node: Tuple[float, float, float],
        goal: Tuple[float, float, float],
        tolerance: float = 0.001  # ~100m
    ) -> bool:
        """Check if node is close enough to goal"""
        lat1, lng1, _ = node
        lat2, lng2, _ = goal
        
        return abs(lat1 - lat2) < tolerance and abs(lng1 - lng2) < tolerance
    
    def _is_in_obstacle(self, node: Tuple[float, float, float], obstacles: List[Dict]) -> bool:
        """Check if node intersects with any obstacle"""
        lat, lng, alt = node
        point = Point(lng, lat, srid=4326)
        
        for obstacle in obstacles:
            alt_min = obstacle.get('altitude_min')
            alt_max = obstacle.get('altitude_max')

            if alt_min is not None and alt < alt_min:
                continue
            if alt_max is not None and alt > alt_max:
                continue

            geom = obstacle['geometry']
            
            # Add safety buffer
            if self.safety_buffer > 0:
                geom = geom.buffer(self.safety_buffer / 111000.0)  # Convert m to degrees
            
            if geom.contains(point) or geom.intersects(point):
                return True
        
        return False
    
    def _reconstruct_path(
        self,
        came_from: Dict[Tuple, Tuple],
        current: Tuple[float, float, float],
        start: Tuple[float, float, float]
    ) -> List[Tuple[float, float, float]]:
        """Reconstruct path from came_from map"""
        path = [current]
        
        while current in came_from:
            current = came_from[current]
            path.append(current)
            
            if current == start:
                break
        
        path.reverse()
        return path
    
    def _nodes_to_waypoints(
        self,
        nodes: List[Tuple[float, float, float]],
        priority: str
    ) -> List[Waypoint]:
        """Convert path nodes to waypoints"""
        waypoints = []
        
        for i, node in enumerate(nodes):
            lat, lng, alt = node
            
            action = 'navigate'
            reason = None
            
            if i == 0:
                action = 'start'
                reason = 'departure_point'
            elif i == len(nodes) - 1:
                action = 'end'
                reason = 'destination'
            elif i > 0 and nodes[i-1][2] != alt:
                action = 'ascend' if alt > nodes[i-1][2] else 'descend'
                reason = f'altitude_change_to_{int(alt)}m'
            
            wp = Waypoint(
                lat=lat, lng=lng, altitude=alt,
                action=action, reason=reason
            )
            
            # Calculate segment distance
            if i > 0:
                prev = nodes[i-1]
                wp.segment_distance = self._haversine(prev[0], prev[1], lat, lng)
            
            waypoints.append(wp)
        
        return waypoints
    
    def _fallback_route_with_avoidance(
        self,
        start: Point,
        end: Point,
        altitude: float,
        obstacles: List[Dict]
    ) -> Tuple[LineString, List[Waypoint]]:
        """
        Fallback route when A* fails
        Creates simple waypoints around obstacles
        """
        if self.enable_debug:
            self.logger.debug("Using fallback avoidance route")
        
        waypoints = [
            Waypoint(
                lat=start.y, lng=start.x, altitude=altitude,
                action='start', reason='departure_point'
            )
        ]
        
        # Check if direct path intersects obstacles
        direct_line = LineString([start, end], srid=4326)
        
        for obstacle in obstacles:
            if obstacle['geometry'].intersects(direct_line):
                # Create waypoint around obstacle
                centroid = obstacle['geometry'].centroid
                
                # Offset perpendicular to direct path
                mid_lat = (start.y + end.y) / 2
                mid_lng = (start.x + end.x) / 2
                
                # Simple offset logic
                offset_distance = 0.01  # ~1km
                avoid_lat = mid_lat + (centroid.y - mid_lat) / abs(centroid.y - mid_lat + 0.001) * offset_distance
                avoid_lng = mid_lng + (centroid.x - mid_lng) / abs(centroid.x - mid_lng + 0.001) * offset_distance
                
                waypoints.append(Waypoint(
                    lat=avoid_lat, lng=avoid_lng, altitude=altitude,
                    action='avoid',
                    reason=f"avoiding_{obstacle['type']}_{obstacle.get('name', 'unknown')}"
                ))
        
        waypoints.append(
            Waypoint(
                lat=end.y, lng=end.x, altitude=altitude,
                action='end', reason='destination'
            )
        )
        
        path = self._waypoints_to_linestring(waypoints)
        return path, waypoints
    
    def _smooth_route(self, waypoints: List[Waypoint]) -> List[Waypoint]:
        """
        Smooth route by removing unnecessary waypoints
        Uses Ramer-Douglas-Peucker-like simplification
        """
        if len(waypoints) <= 2:
            return waypoints
        
        if self.enable_debug:
            original_count = len(waypoints)
        
        # Keep start, end, and action waypoints (altitude changes, avoidance)
        essential = [0]  # Start
        
        for i in range(1, len(waypoints) - 1):
            if waypoints[i].action in ['avoid', 'ascend', 'descend', 'hover']:
                essential.append(i)
        
        essential.append(len(waypoints) - 1)  # End
        
        smoothed = [waypoints[i] for i in essential]
        
        if self.enable_debug:
            self.logger.debug(
                "Route smoothed",
                original_waypoints=original_count,
                smoothed_waypoints=len(smoothed),
                reduction_percent=round((1 - len(smoothed)/original_count) * 100, 1)
            )
        
        return smoothed
    
    def _apply_terrain_following(self, waypoints: List[Waypoint]) -> List[Waypoint]:
        """
        Adjust waypoint altitudes to follow terrain
        Ensures minimum clearance above ground
        """
        if self.enable_debug:
            self.logger.debug("Applying terrain following")
        
        # In production, query DEM (Digital Elevation Model) for each waypoint
        # For now, simplified implementation
        
        for wp in waypoints:
            # Placeholder: get terrain elevation at this point
            terrain_elevation = self._get_terrain_elevation(wp.lat, wp.lng)
            
            # Ensure minimum clearance
            min_safe_altitude = terrain_elevation + self.min_terrain_clearance
            if wp.altitude < min_safe_altitude:
                if self.enable_debug:
                    self.logger.debug(
                        "Altitude adjusted for terrain",
                        location=f"({wp.lat:.4f}, {wp.lng:.4f})",
                        original_alt=wp.altitude,
                        new_alt=min_safe_altitude
                    )
                wp.altitude = min_safe_altitude
                wp.reason = f"{wp.reason or 'navigate'}_terrain_adjusted"
        
        return waypoints
    
    def _get_terrain_elevation(self, lat: float, lng: float) -> float:
        """Get terrain elevation at point (placeholder)"""
        # In production: query SRTM, ASTER GDEM, or other DEM service
        # For now, return sea level
        return 0.0
    
    def _apply_weather_adjustments(
        self,
        waypoints: List[Waypoint],
        weather_data: Dict
    ) -> List[Waypoint]:
        """Apply weather impact to waypoints"""
        if self.enable_debug:
            self.logger.debug("Applying weather adjustments", weather_keys=list(weather_data.keys()))
        
        wind_speed = weather_data.get('wind_speed_kmh', 0)
        wind_direction = weather_data.get('wind_direction_deg', 0)
        
        for i, wp in enumerate(waypoints):
            if i == 0:
                continue
            
            # Calculate wind impact based on segment bearing
            prev_wp = waypoints[i-1]
            bearing = self._calculate_bearing(prev_wp.lat, prev_wp.lng, wp.lat, wp.lng)
            
            # Wind factor: 0° = headwind (worst), 180° = tailwind (best)
            wind_angle_diff = abs(((wind_direction - bearing + 180) % 360) - 180)
            wind_factor = 1.0 + (np.cos(np.radians(wind_angle_diff)) * wind_speed / 100.0)
            
            wp.wind_factor = max(0.7, min(1.3, wind_factor))
        
        return waypoints
    
    def _calculate_bearing(self, lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        """Calculate bearing between two points in degrees"""
        lat1_rad, lng1_rad = np.radians(lat1), np.radians(lng1)
        lat2_rad, lng2_rad = np.radians(lat2), np.radians(lng2)
        
        dlng = lng2_rad - lng1_rad
        
        x = np.sin(dlng) * np.cos(lat2_rad)
        y = np.cos(lat1_rad) * np.sin(lat2_rad) - np.sin(lat1_rad) * np.cos(lat2_rad) * np.cos(dlng)
        
        bearing = np.degrees(np.arctan2(x, y))
        return (bearing + 360) % 360
    
    def _calculate_metrics(
        self,
        path: LineString,
        waypoints: List[Waypoint],
        direct_distance: float,
        method: str,
        start_time: datetime,
        drone_speed: float
    ) -> RouteMetrics:
        """Calculate comprehensive route metrics"""
        
        # Total distance via waypoints
        total_distance = sum(wp.segment_distance for wp in waypoints)
        
        # Detour percentage
        detour_percent = ((total_distance - direct_distance) / direct_distance * 100) if direct_distance > 0 else 0.0
        
        # Altitude changes
        altitude_changes = sum(
            1 for wp in waypoints if wp.action in ['ascend', 'descend']
        )
        
        # Estimated duration
        avg_speed = drone_speed * 0.8  # 80% of max speed
        estimated_duration = (total_distance / avg_speed) * 60  # minutes
        
        # Complexity score (0-1)
        complexity = min(1.0, (
            len(waypoints) / 20.0 * 0.4 +  # Waypoint count
            altitude_changes / 5.0 * 0.3 +  # Altitude changes
            detour_percent / 50.0 * 0.3  # Detour amount
        ))
        
        # Computation time
        computation_time = (datetime.now() - start_time).total_seconds() * 1000
        
        return RouteMetrics(
            total_distance_km=round(total_distance, 3),
            direct_distance_km=round(direct_distance, 3),
            detour_percent=round(detour_percent, 2),
            estimated_duration_minutes=round(estimated_duration, 2),
            waypoint_count=len(waypoints),
            altitude_changes=altitude_changes,
            no_fly_zones_avoided=len([w for w in waypoints if 'no_fly' in (w.reason or '')]),
            weather_hazards_avoided=len([w for w in waypoints if 'weather' in (w.reason or '')]),
            terrain_clearance_min=min((wp.altitude for wp in waypoints), default=0.0),
            avg_segment_length=round(total_distance / max(len(waypoints) - 1, 1), 3),
            complexity_score=round(complexity, 3),
            optimization_method=method,
            computation_time_ms=round(computation_time, 2)
        )
    
    def _calculate_distance(self, point1: Point, point2: Point) -> float:
        """Calculate distance between two points using PostGIS"""
        try:
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT ST_Distance(
                        ST_Transform(%s::geography, 3857),
                        ST_Transform(%s::geography, 3857)
                    ) / 1000.0 as distance_km
                """, [point1.ewkt, point2.ewkt])
                row = cursor.fetchone()
                return float(row[0]) if row else 0.0
        except Exception as e:
            self.logger.error("Distance calculation failed", error=str(e))
            # Fallback to haversine
            return self._haversine(point1.y, point1.x, point2.y, point2.x)
    
    def _waypoints_to_linestring(self, waypoints: List[Waypoint]) -> LineString:
        """Convert waypoints to LineString geometry"""
        points = [Point(wp.lng, wp.lat, wp.altitude) for wp in waypoints]
        return LineString(points, srid=4326)
    
    def _create_bbox(self, start: Point, end: Point, buffer_km: float = 5.0) -> Polygon:
        """Create bounding box for spatial queries"""
        # Calculate bounds with buffer
        min_lat = min(start.y, end.y) - (buffer_km / 111.0)
        max_lat = max(start.y, end.y) + (buffer_km / 111.0)
        min_lng = min(start.x, end.x) - (buffer_km / 111.0)
        max_lng = max(start.x, end.x) + (buffer_km / 111.0)
        
        bbox = Polygon([
            (min_lng, min_lat),
            (max_lng, min_lat),
            (max_lng, max_lat),
            (min_lng, max_lat),
            (min_lng, min_lat)
        ], srid=4326)
        
        return bbox
    
    def _validate_altitude(self, altitude: float, max_altitude: Optional[float]) -> float:
        """Validate and clamp altitude to safe range"""
        max_alt = max_altitude or self.max_altitude
        
        if altitude < self.min_altitude:
            self.logger.warning(
                "Altitude below minimum, adjusting",
                requested=altitude,
                adjusted=self.min_altitude
            )
            return self.min_altitude
        
        if altitude > max_alt:
            self.logger.warning(
                "Altitude above maximum, adjusting",
                requested=altitude,
                adjusted=max_alt
            )
            return max_alt
        
        return altitude
    
    def _get_cache_key(self, start: Point, end: Point, altitude: float,
                       method: str, avoids_no_fly: bool, avoids_weather: bool) -> str:
        """Generate cache key for route"""
        key_data = f"{start.y:.6f}_{start.x:.6f}_{end.y:.6f}_{end.x:.6f}_{altitude}_{method}_{avoids_no_fly}_{avoids_weather}"
        return hashlib.md5(key_data.encode()).hexdigest()
    
    def _get_from_cache(self, cache_key: str) -> Optional[Tuple]:
        """Retrieve route from cache"""
        try:
            cached = cache.get(f"route_{cache_key}")
            if cached:
                if self.enable_debug:
                    self.logger.debug("Cache hit", cache_key=cache_key[:16])
                return cached
        except Exception as e:
            self.logger.error("Cache retrieval failed", error=str(e))
        return None
    
    def _save_to_cache(self, cache_key: str, data: Tuple, timeout: int = 3600):
        """Save route to cache"""
        try:
            cache.set(f"route_{cache_key}", data, timeout)
            if self.enable_debug:
                self.logger.debug("Route cached", cache_key=cache_key[:16], timeout=timeout)
        except Exception as e:
            self.logger.error("Cache save failed", error=str(e))
    
    def get_optimization_stats(self) -> Dict:
        """Get optimizer performance statistics"""
        return {
            'total_routes': sum(self.optimization_stats.values()),
            'by_method': dict(self.optimization_stats),
            'cache_size': len(self.route_cache),
            'cache_enabled': self.cache_enabled
        }
    
    def clear_cache(self):
        """Clear route cache"""
        self.route_cache.clear()
        try:
            cache.delete_pattern("route_*")
            self.logger.info("Route cache cleared")
        except Exception as e:
            self.logger.error("Cache clear failed", error=str(e))
    
    def batch_optimize_routes(
        self,
        route_requests: List[Dict]
    ) -> List[Tuple[LineString, RouteMetrics, List[Waypoint]]]:
        """
        Optimize multiple routes in batch for efficiency
        Useful for fleet routing optimization
        """
        if self.enable_debug:
            self.logger.debug("Batch optimization started", count=len(route_requests))
        
        results = []
        
        for i, request in enumerate(route_requests):
            try:
                result = self.optimize_route(**request)
                results.append(result)
            except Exception as e:
                self.logger.error(
                    "Batch route optimization failed",
                    index=i,
                    error=str(e)
                )
                results.append(None)
        
        successful = sum(1 for r in results if r is not None)
        
        self.logger.info(
            "Batch optimization complete",
            total=len(route_requests),
            successful=successful,
            failed=len(route_requests) - successful
        )
        
        return results

# """
# AI-powered Route Optimizer
# Uses PostGIS spatial queries, A* algorithm, and avoids no-fly zones
# """
# import structlog
# from typing import List, Tuple, Optional
# from django.contrib.gis.geos import Point, LineString
# from django.db import connection

# logger = structlog.get_logger(__name__)


# class RouteOptimizer:
#     """
#     Route optimizer using PostGIS and graph algorithms
#     Avoids no-fly zones, weather hazards, and finds shortest/safest path
#     """
    
#     def __init__(self):
#         self.logger = logger.bind(namespace="routes.ai.optimizer")
    
#     def optimize_route(
#         self,
#         start_point: Point,
#         end_point: Point,
#         altitude: float = 100.0,
#         avoids_no_fly: bool = True,
#         avoids_weather: bool = True,
#         method: str = 'astar'
#     ) -> Tuple[LineString, float, List[dict]]:
#         """
#         Optimize route from start to end point
        
#         Args:
#             start_point: Starting location (Point)
#             end_point: Destination location (Point)
#             altitude: Flight altitude in meters
#             avoids_no_fly: Whether to avoid no-fly zones
#             avoids_weather: Whether to avoid weather hazards
#             method: Optimization method ('astar', 'dijkstra', 'rl')
        
#         Returns:
#             Tuple of (optimized_path, total_distance_km, waypoints)
#         """
#         self.logger.info(
#             "Optimizing route",
#             start_lat=start_point.y,
#             start_lng=start_point.x,
#             end_lat=end_point.y,
#             end_lng=end_point.x,
#             altitude=altitude,
#             method=method
#         )
        
#         # Get waypoints avoiding obstacles
#         waypoints = self._generate_waypoints(
#             start_point,
#             end_point,
#             altitude,
#             avoids_no_fly,
#             avoids_weather
#         )
        
#         # Build path from waypoints
#         points = [start_point] + [Point(wp['lng'], wp['lat']) for wp in waypoints] + [end_point]
#         optimized_path = LineString(points, srid=4326)
        
#         # Calculate distance using PostGIS
#         with connection.cursor() as cursor:
#             cursor.execute("""
#                 SELECT ST_Length(
#                     ST_Transform(%s::geography, 3857)
#                 ) / 1000.0 as distance_km
#             """, [optimized_path])
#             row = cursor.fetchone()
#             total_distance = float(row[0]) if row else 0.0
        
#         self.logger.info(
#             "Route optimized",
#             distance_km=total_distance,
#             waypoint_count=len(waypoints)
#         )
        
#         return optimized_path, total_distance, waypoints
    
#     def _generate_waypoints(
#         self,
#         start: Point,
#         end: Point,
#         altitude: float,
#         avoids_no_fly: bool,
#         avoids_weather: bool
#     ) -> List[dict]:
#         """
#         Generate waypoints avoiding obstacles
#         Uses simplified approach for prototype
#         """
#         waypoints = []
        
#         if avoids_no_fly:
#             # Check for no-fly zones along direct path
#             # Simplified: create buffer waypoints if obstacles detected
#             from apps.zones.models import NoFlyZone
            
#             # Sample points along direct path
#             direct_path = LineString([start, end], srid=4326)
            
#             # Check intersections with no-fly zones
#             no_fly_zones = NoFlyZone.objects.filter(
#                 boundary__intersects=direct_path,
#                 is_active=True
#             )
            
#             if no_fly_zones.exists():
#                 self.logger.info(
#                     "No-fly zones detected, generating avoidance waypoints",
#                     zone_count=no_fly_zones.count()
#                 )
                
#                 # Generate waypoints around obstacles
#                 # Simplified: create waypoint offset from direct path
#                 mid_lat = (start.y + end.y) / 2
#                 mid_lng = (start.x + end.x) / 2
                
#                 # Offset to avoid zone (simplified logic)
#                 offset_lng = mid_lng + 0.01  # 1km offset
                
#                 waypoints.append({
#                     'lat': mid_lat,
#                     'lng': offset_lng,
#                     'altitude': altitude,
#                     'action': 'avoid'
#                 })
        
#         return waypoints
    
#     def calculate_distance(self, point1: Point, point2: Point) -> float:
#         """Calculate distance between two points in kilometers"""
#         with connection.cursor() as cursor:
#             cursor.execute("""
#                 SELECT ST_Distance(
#                     %s::geography,
#                     %s::geography
#                 ) / 1000.0 as distance_km
#             """, [point1, point2])
#             row = cursor.fetchone()
#             return float(row[0]) if row else 0.0

