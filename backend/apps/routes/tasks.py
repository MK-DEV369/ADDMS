"""
Celery tasks for route optimization and ETA prediction
"""
from celery import shared_task
from django.utils import timezone
from datetime import timedelta
import structlog

from datetime import timedelta
from django.contrib.auth import get_user_model
from django.contrib.gis.geos import LineString

from .ai.route_optimizer import RouteOptimizer
from .ai.eta_predictor import ETAPredictor
from apps.analytics.models import SystemLog

logger = structlog.get_logger(__name__)
route_optimizer = RouteOptimizer()
eta_predictor = ETAPredictor()


@shared_task(bind=True, max_retries=3)
def optimize_route_and_predict_eta(self, delivery_order_id):
    """
    Main AI task: Optimize route and predict ETA for delivery order
    """
    try:
        from apps.deliveries.models import DeliveryOrder, OrderStatusHistory
        from apps.drones.models import Drone
        from apps.routes.models import Route, Waypoint
        from apps.notifications.tasks import notify_customer_event
        from django.contrib.gis.geos import Point
        
        logger.info(
            "Starting route optimization",
            namespace="routes",
            order_id=delivery_order_id
        )
        SystemLog.log(
            level=SystemLog.LogLevel.INFO,
            service='routes',
            message=f"Route optimization started for order {delivery_order_id}",
            metadata={'order_id': delivery_order_id}
        )
        
        order = DeliveryOrder.objects.select_related('drone', 'package').get(id=delivery_order_id)
        
        if not order.pickup_location or not order.delivery_location:
            raise ValueError("Order must have pickup and delivery locations")
        
        # Get drone specs
        drone = order.drone
        if not drone:
            raise ValueError("Order must have assigned drone")
        
        # Optimize route with robust fallback to direct route if AI fails
        metrics = None
        try:
            optimized_path, metrics, waypoints_data = route_optimizer.optimize_route(
                start_point=order.pickup_location,
                end_point=order.delivery_location,
                altitude=float(drone.current_altitude or 100.0),
                avoids_no_fly=True,
                avoids_weather=True,
                method='astar'
            )
            distance_km = float(metrics.total_distance_km)
            optimization_method = metrics.optimization_method
        except Exception as opt_exc:
            logger.warning(
                "Route optimizer failed; using direct fallback",
                namespace="routes",
                order_id=delivery_order_id,
                error=str(opt_exc)
            )
            SystemLog.log(
                level=SystemLog.LogLevel.WARNING,
                service='routes',
                message=f"Optimizer fallback for order {delivery_order_id}",
                metadata={'order_id': delivery_order_id, 'error': str(opt_exc)}
            )
            optimized_path = LineString([
                order.pickup_location,
                order.delivery_location
            ], srid=4326)
            # Rough distance fallback: degrees to km (~111km per degree)
            distance_km = float(order.pickup_location.distance(order.delivery_location) * 111)
            optimization_method = 'direct_fallback'
            waypoints_data = [
                {'lat': order.pickup_location.y, 'lng': order.pickup_location.x, 'altitude': float(drone.current_altitude or 100.0), 'action': 'start'},
                {'lat': order.delivery_location.y, 'lng': order.delivery_location.x, 'altitude': float(drone.current_altitude or 100.0), 'action': 'end'}
            ]

        # Predict ETA (ML with rule-based fallback)
        eta_prediction = None
        try:
            eta_prediction = eta_predictor.predict_eta(
                distance_km=distance_km,
                altitude_avg=float(drone.current_altitude or 100.0),
                altitude_variance=metrics.altitude_changes if metrics else 50.0,
                route_complexity=metrics.complexity_score if metrics else 0.3,
                payload_weight_kg=float(order.package.weight),
                battery_level=drone.battery_level,
                drone_model=drone.model,
                drone_age_days=0,
                wind_speed_kmh=10.0,
                precipitation=0.0,
                visibility_km=10.0,
                air_pressure_hpa=1013.0,
                drone_max_speed=float(drone.max_speed)
            )
            eta_minutes = float(eta_prediction.eta_minutes)
            estimated_eta_datetime = eta_prediction.eta_datetime
            eta_confidence = float(eta_prediction.confidence)
        except Exception as eta_exc:
            logger.warning(
                "ETA predictor failed; using rule-based fallback",
                namespace="routes",
                order_id=delivery_order_id,
                error=str(eta_exc)
            )
            base_speed = max(float(drone.max_speed) * 0.75, 10.0)
            eta_minutes = float((distance_km / base_speed) * 60 * 1.2)
            estimated_eta_datetime = timezone.now() + timedelta(minutes=eta_minutes)
            eta_confidence = 50.0

        # Compute delivery cost: base fee + distance * weight factor
        try:
            weight_kg = float(order.package.weight or 0)
        except Exception:
            weight_kg = 0.0
        base_fee = 50.0
        variable_fee = distance_km * max(weight_kg, 0.5) * 10.0  # ₹10 per km per kg (min weight 0.5kg)
        total_cost = round(base_fee + variable_fee, 2)
        
        # Create or update route
        route, created = Route.objects.update_or_create(
            delivery_order=order,
            defaults={
                'path': optimized_path,
                'total_distance': distance_km,
                'estimated_duration': int(round(eta_minutes)),
                'estimated_eta': estimated_eta_datetime,
                'confidence_score': eta_confidence,
                'optimization_method': optimization_method,
                'avoids_no_fly_zones': True,
                'avoids_weather_hazards': True,
                'altitude_profile': {
                    'waypoints': [
                        {
                            'lat': getattr(wp, 'lat', wp['lat']),
                            'lng': getattr(wp, 'lng', wp['lng']),
                            'altitude': float(getattr(wp, 'altitude', wp.get('altitude', 0))),
                            'action': getattr(wp, 'action', wp.get('action', 'waypoint'))
                        }
                        for wp in waypoints_data
                    ]
                }
            }
        )
        
        # Create waypoints
        Waypoint.objects.filter(route=route).delete()
        for idx, wp_data in enumerate(waypoints_data, start=1):
            lat = getattr(wp_data, 'lat', wp_data.get('lat'))
            lng = getattr(wp_data, 'lng', wp_data.get('lng'))
            altitude = float(getattr(wp_data, 'altitude', wp_data.get('altitude', 0)))
            action = getattr(wp_data, 'action', wp_data.get('action', 'waypoint'))

            Waypoint.objects.create(
                route=route,
                sequence=idx,
                position=Point(lng, lat, srid=4326),
                altitude=altitude,
                action=action
            )
        
        # Update order with ETA
        order.estimated_eta = estimated_eta_datetime
        order.estimated_duration_minutes = int(round(eta_minutes))
        order.total_cost = total_cost
        if order.status not in [DeliveryOrder.Status.IN_TRANSIT, DeliveryOrder.Status.DELIVERING]:
            order.status = DeliveryOrder.Status.IN_TRANSIT
            order.picked_up_at = order.picked_up_at or timezone.now()
            order.save(update_fields=['estimated_eta', 'estimated_duration_minutes', 'total_cost', 'status', 'picked_up_at'])
            OrderStatusHistory.objects.create(
                order=order,
                status=order.status,
                changed_by=None,
                notes="Route optimized; drone en route"
            )
        else:
            order.save(update_fields=['estimated_eta', 'estimated_duration_minutes', 'total_cost'])

        # Update drone status to delivering
        if drone.status != Drone.Status.DELIVERING:
            drone.status = Drone.Status.DELIVERING
            drone.save(update_fields=['status'])
        
        # Notify customer
        notify_customer_event.delay(
            user_id=order.customer.id,
            event_type='route_optimized',
            title='Route Optimized',
            message=f'Your delivery route has been optimized. Estimated arrival: {estimated_eta_datetime.strftime("%Y-%m-%d %H:%M")}',
            related_object_id=order.id,
            related_object_type='delivery_order'
        )

        # Notify all admins/managers
        User = get_user_model()
        for admin_user in User.objects.filter(is_staff=True, is_active=True):
            notify_customer_event.delay(
                user_id=admin_user.id,
                event_type='route_optimized_admin',
                title='Route Optimized',
                message=f'Order {order.id} is en route. ETA {estimated_eta_datetime.strftime("%Y-%m-%d %H:%M")}.',
                related_object_id=order.id,
                related_object_type='delivery_order'
            )
        
        logger.info(
            "Route optimized successfully",
            namespace="routes",
            order_id=delivery_order_id,
            route_id=route.id,
            distance_km=distance_km,
            eta_minutes=eta_minutes
        )
        SystemLog.log(
            level=SystemLog.LogLevel.INFO,
            service='routes',
            message=f"Route optimized for order {delivery_order_id}",
            metadata={
                'order_id': delivery_order_id,
                'route_id': route.id,
                'distance_km': distance_km,
                'eta_minutes': eta_minutes,
                'estimated_eta': estimated_eta_datetime.isoformat() if estimated_eta_datetime else None,
                'total_cost': total_cost,
                'method': optimization_method,
            }
        )
        
        return {
            'route_id': route.id,
            'distance_km': distance_km,
            'eta_minutes': eta_minutes,
            'estimated_eta': estimated_eta_datetime.isoformat()
        }
        
    except Exception as exc:
        logger.error(
            "Route optimization failed",
            namespace="routes",
            order_id=delivery_order_id,
            error=str(exc)
        )
        SystemLog.log(
            level=SystemLog.LogLevel.ERROR,
            service='routes',
            message=f"Route optimization failed for order {delivery_order_id}",
            metadata={'order_id': delivery_order_id, 'error': str(exc)}
        )
        raise self.retry(exc=exc, countdown=60)
