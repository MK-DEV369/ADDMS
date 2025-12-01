"""
Celery tasks for route optimization and ETA prediction
"""
from celery import shared_task
from django.utils import timezone
from datetime import timedelta
import structlog

from .ai.route_optimizer import RouteOptimizer
from .ai.eta_predictor import ETAPredictor

logger = structlog.get_logger(__name__)
route_optimizer = RouteOptimizer()
eta_predictor = ETAPredictor()


@shared_task(bind=True, max_retries=3)
def optimize_route_and_predict_eta(self, delivery_order_id):
    """
    Main AI task: Optimize route and predict ETA for delivery order
    """
    try:
        from apps.deliveries.models import DeliveryOrder
        from apps.routes.models import Route, Waypoint
        from apps.notifications.tasks import notify_customer_event
        from django.contrib.gis.geos import Point
        
        logger.info(
            "Starting route optimization",
            namespace="routes",
            order_id=delivery_order_id
        )
        
        order = DeliveryOrder.objects.select_related('drone', 'package').get(id=delivery_order_id)
        
        if not order.pickup_location or not order.delivery_location:
            raise ValueError("Order must have pickup and delivery locations")
        
        # Get drone specs
        drone = order.drone
        if not drone:
            raise ValueError("Order must have assigned drone")
        
        # Optimize route
        optimized_path, distance_km, waypoints_data = route_optimizer.optimize_route(
            start_point=order.pickup_location,
            end_point=order.delivery_location,
            altitude=drone.current_altitude or 100.0,
            avoids_no_fly=True,
            avoids_weather=True,
            method='astar'
        )
        
        # Predict ETA
        start_time = timezone.now()
        eta_result = eta_predictor.predict_eta(
            distance_km=distance_km,
            altitude_avg=drone.current_altitude or 100.0,
            weather_factor=1.0,  # TODO: Get from weather cache
            payload_weight=float(order.package.weight),
            battery_level=drone.battery_level,
            drone_max_speed=float(drone.max_speed)
        )
        
        estimated_eta_datetime = eta_predictor.predict_eta_datetime(
            start_time=start_time,
            distance_km=distance_km,
            altitude_avg=drone.current_altitude or 100.0,
            weather_factor=1.0,
            payload_weight=float(order.package.weight),
            battery_level=drone.battery_level,
            drone_max_speed=float(drone.max_speed)
        )
        
        # Create or update route
        route, created = Route.objects.update_or_create(
            delivery_order=order,
            defaults={
                'path': optimized_path,
                'total_distance': distance_km,
                'estimated_duration': int(eta_result['eta_minutes']),
                'estimated_eta': estimated_eta_datetime,
                'confidence_score': eta_result['confidence'],
                'optimization_method': 'astar',
                'avoids_no_fly_zones': True,
                'avoids_weather_hazards': True,
                'altitude_profile': {}
            }
        )
        
        # Create waypoints
        Waypoint.objects.filter(route=route).delete()
        for idx, wp_data in enumerate(waypoints_data, start=1):
            Waypoint.objects.create(
                route=route,
                sequence=idx,
                position=Point(wp_data['lng'], wp_data['lat'], srid=4326),
                altitude=wp_data['altitude'],
                action=wp_data.get('action', 'waypoint')
            )
        
        # Update order with ETA
        order.estimated_eta = estimated_eta_datetime
        order.save()
        
        # Notify customer
        notify_customer_event.delay(
            user_id=order.customer.id,
            event_type='route_optimized',
            title='Route Optimized',
            message=f'Your delivery route has been optimized. Estimated arrival: {estimated_eta_datetime.strftime("%Y-%m-%d %H:%M")}',
            related_object_id=order.id,
            related_object_type='delivery_order'
        )
        
        logger.info(
            "Route optimized successfully",
            namespace="routes",
            order_id=delivery_order_id,
            route_id=route.id,
            distance_km=distance_km,
            eta_minutes=eta_result['eta_minutes']
        )
        
        return {
            'route_id': route.id,
            'distance_km': distance_km,
            'eta_minutes': eta_result['eta_minutes'],
            'estimated_eta': estimated_eta_datetime.isoformat()
        }
        
    except Exception as exc:
        logger.error(
            "Route optimization failed",
            namespace="routes",
            order_id=delivery_order_id,
            error=str(exc)
        )
        raise self.retry(exc=exc, countdown=60)
