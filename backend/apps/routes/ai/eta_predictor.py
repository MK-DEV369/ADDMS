"""
AI-powered ETA Prediction Model for Autonomous Drone Delivery
Optimized with ML best practices, comprehensive debugging, and historical data tracking
"""
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
import structlog
from typing import Dict, Optional, List, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
import pickle
import json
from pathlib import Path

logger = structlog.get_logger(__name__)


@dataclass
class HistoricalDelivery:
    """Historical delivery data point for training"""
    # Route characteristics
    distance_km: float
    altitude_avg: float
    altitude_variance: float
    route_complexity: float  # 0-1: turns, obstacles
    
    # Environmental conditions
    temperature_c: float
    wind_speed_kmh: float
    wind_direction_deg: float  # Relative to route
    precipitation: float  # 0-1 scale
    visibility_km: float
    air_pressure_hpa: float
    
    # Drone state
    payload_weight_kg: float
    battery_start: int
    battery_end: int
    drone_model: str
    drone_age_days: int
    
    # Operational factors
    time_of_day: int  # Hour 0-23
    day_of_week: int  # 0-6
    air_traffic_density: float  # 0-1 scale
    
    # Outcome
    actual_duration_minutes: float
    success: bool
    delay_reason: Optional[str] = None
    
    # Metadata
    timestamp: datetime = None
    delivery_id: str = None


@dataclass
class ETAPrediction:
    """Structured ETA prediction result"""
    eta_minutes: float
    eta_datetime: datetime
    confidence: float
    uncertainty_range: Tuple[float, float]  # (min, max) minutes
    
    # Contributing factors
    base_speed_kmh: float
    effective_speed_kmh: float
    speed_reduction_percent: float
    
    # Factor breakdown
    payload_impact: float
    altitude_impact: float
    battery_impact: float
    weather_impact: float
    traffic_impact: float
    historical_adjustment: float
    
    # Debugging info
    model_used: str  # 'ml' or 'rule_based'
    similar_routes_count: int
    feature_importance: Optional[Dict] = None


class ETAPredictor:
    """
    Advanced ETA prediction using ML with fallback to rule-based system
    """
    
    def __init__(self, model_path: Optional[Path] = None, enable_debug: bool = True):
        self.logger = logger.bind(namespace="routes.ai.eta_predictor")
        self.enable_debug = enable_debug
        
        # ML components
        self.model: Optional[RandomForestRegressor] = None
        self.scaler = StandardScaler()
        self.feature_names: List[str] = []
        self.is_trained = False
        
        # Historical data cache
        self.historical_deliveries: List[HistoricalDelivery] = []
        self.route_cache: Dict[str, List[float]] = {}  # route_hash -> [durations]
        
        # Model configuration
        self.model_path = model_path or Path("models/eta_model.pkl")
        self.scaler_path = model_path.parent / "eta_scaler.pkl" if model_path else Path("models/eta_scaler.pkl")
        
        # Performance tracking
        self.prediction_errors: List[float] = []
        self.last_retrain: Optional[datetime] = None
        
        self._initialize()
    
    def _initialize(self):
        """Initialize model and load historical data"""
        self.logger.info("Initializing ETA predictor", debug_enabled=self.enable_debug)
        
        # Define feature set
        self.feature_names = [
            'distance_km', 'altitude_avg', 'altitude_variance', 'route_complexity',
            'temperature_c', 'wind_speed_kmh', 'wind_direction_deg', 'precipitation',
            'visibility_km', 'air_pressure_hpa',
            'payload_weight_kg', 'battery_start', 'drone_age_days',
            'time_of_day', 'day_of_week', 'air_traffic_density'
        ]
        
        # Try to load existing model
        if self.model_path.exists():
            self._load_model()
        else:
            self._create_default_model()
        
        self.logger.info(
            "ETA predictor initialized",
            is_trained=self.is_trained,
            feature_count=len(self.feature_names)
        )
    
    def _create_default_model(self):
        """Create default ML model"""
        self.model = RandomForestRegressor(
            n_estimators=200,
            max_depth=15,
            min_samples_split=5,
            min_samples_leaf=2,
            max_features='sqrt',
            random_state=42,
            n_jobs=-1,
            oob_score=True,
            verbose=0
        )
        self.logger.info("Created default RandomForest model")
    
    def _load_model(self):
        """Load pre-trained model from disk"""
        try:
            with open(self.model_path, 'rb') as f:
                self.model = pickle.load(f)
            with open(self.scaler_path, 'rb') as f:
                self.scaler = pickle.load(f)
            self.is_trained = True
            self.logger.info("Loaded pre-trained model", path=str(self.model_path))
        except Exception as e:
            self.logger.error("Failed to load model", error=str(e))
            self._create_default_model()
    
    def _save_model(self):
        """Save trained model to disk"""
        try:
            self.model_path.parent.mkdir(parents=True, exist_ok=True)
            with open(self.model_path, 'wb') as f:
                pickle.dump(self.model, f)
            with open(self.scaler_path, 'wb') as f:
                pickle.dump(self.scaler, f)
            self.logger.info("Model saved", path=str(self.model_path))
        except Exception as e:
            self.logger.error("Failed to save model", error=str(e))
    
    def _extract_features(self, delivery: HistoricalDelivery) -> np.ndarray:
        """Extract feature vector from delivery data"""
        features = [getattr(delivery, name) for name in self.feature_names]
        return np.array(features).reshape(1, -1)
    
    def _get_route_hash(self, distance_km: float, altitude_avg: float, 
                        weather_factor: float) -> str:
        """Generate hash for route caching"""
        # Round to reduce cache fragmentation
        d = round(distance_km, 1)
        a = round(altitude_avg, 0)
        w = round(weather_factor, 2)
        return f"{d}_{a}_{w}"
    
    def add_historical_delivery(self, delivery: HistoricalDelivery):
        """Add historical delivery for training"""
        self.historical_deliveries.append(delivery)
        
        # Update route cache
        route_hash = self._get_route_hash(
            delivery.distance_km,
            delivery.altitude_avg,
            delivery.wind_speed_kmh / 50.0  # Normalize wind as weather proxy
        )
        if route_hash not in self.route_cache:
            self.route_cache[route_hash] = []
        self.route_cache[route_hash].append(delivery.actual_duration_minutes)
        
        if self.enable_debug:
            self.logger.debug(
                "Historical delivery added",
                delivery_id=delivery.delivery_id,
                duration=delivery.actual_duration_minutes,
                route_hash=route_hash,
                total_historical=len(self.historical_deliveries)
            )
        
        # Auto-retrain if we have enough data and it's been a while
        if len(self.historical_deliveries) >= 100:
            days_since_retrain = (datetime.now() - self.last_retrain).days if self.last_retrain else 999
            if days_since_retrain >= 7:
                self.logger.info("Auto-retraining triggered", 
                               data_points=len(self.historical_deliveries))
                self.train()
    
    def train(self, min_samples: int = 50) -> Dict:
        """Train the ML model on historical data"""
        if len(self.historical_deliveries) < min_samples:
            self.logger.warning(
                "Insufficient training data",
                current=len(self.historical_deliveries),
                required=min_samples
            )
            return {'success': False, 'reason': 'insufficient_data'}
        
        self.logger.info("Training ETA model", samples=len(self.historical_deliveries))
        
        # Prepare training data
        X = []
        y = []
        for delivery in self.historical_deliveries:
            if delivery.success:  # Only train on successful deliveries
                X.append(self._extract_features(delivery).flatten())
                y.append(delivery.actual_duration_minutes)
        
        X = np.array(X)
        y = np.array(y)
        
        if self.enable_debug:
            self.logger.debug(
                "Training data prepared",
                X_shape=X.shape,
                y_mean=float(np.mean(y)),
                y_std=float(np.std(y))
            )
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Train model
        self.model.fit(X_scaled, y)
        self.is_trained = True
        self.last_retrain = datetime.now()
        
        # Calculate training metrics
        train_score = self.model.score(X_scaled, y)
        oob_score = self.model.oob_score_ if hasattr(self.model, 'oob_score_') else None
        
        # Get feature importance
        feature_importance = dict(zip(
            self.feature_names,
            self.model.feature_importances_
        ))
        top_features = sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)[:5]
        
        self.logger.info(
            "Model training complete",
            train_score=round(train_score, 4),
            oob_score=round(oob_score, 4) if oob_score else None,
            top_features=[f"{k}: {v:.3f}" for k, v in top_features]
        )
        
        # Save model
        self._save_model()
        
        return {
            'success': True,
            'train_score': train_score,
            'oob_score': oob_score,
            'feature_importance': feature_importance,
            'samples_used': len(X)
        }
    
    def predict_eta(
        self,
        distance_km: float,
        altitude_avg: float = 100.0,
        altitude_variance: float = 50.0,
        route_complexity: float = 0.3,
        temperature_c: float = 20.0,
        wind_speed_kmh: float = 10.0,
        wind_direction_deg: float = 0.0,
        precipitation: float = 0.0,
        visibility_km: float = 10.0,
        air_pressure_hpa: float = 1013.0,
        payload_weight_kg: float = 2.0,
        battery_level: int = 100,
        drone_model: str = "default",
        drone_age_days: int = 0,
        time_of_day: Optional[int] = None,
        day_of_week: Optional[int] = None,
        air_traffic_density: float = 0.3,
        drone_max_speed: float = 60.0,
        start_time: Optional[datetime] = None
    ) -> ETAPrediction:
        """
        Predict ETA with comprehensive factor analysis
        """
        start_time = start_time or datetime.now()
        time_of_day = time_of_day if time_of_day is not None else start_time.hour
        day_of_week = day_of_week if day_of_week is not None else start_time.weekday()
        
        if self.enable_debug:
            self.logger.debug(
                "ETA prediction started",
                distance_km=distance_km,
                altitude_avg=altitude_avg,
                payload_weight_kg=payload_weight_kg,
                battery_level=battery_level,
                wind_speed_kmh=wind_speed_kmh,
                time_of_day=time_of_day
            )
        
        # Try ML prediction first
        if self.is_trained:
            prediction = self._predict_ml(
                distance_km, altitude_avg, altitude_variance, route_complexity,
                temperature_c, wind_speed_kmh, wind_direction_deg, precipitation,
                visibility_km, air_pressure_hpa,
                payload_weight_kg, battery_level, drone_age_days,
                time_of_day, day_of_week, air_traffic_density,
                drone_max_speed, start_time
            )
            
            if self.enable_debug:
                self.logger.debug("ML prediction used", eta_minutes=prediction.eta_minutes)
        else:
            # Fallback to rule-based
            prediction = self._predict_rule_based(
                distance_km, altitude_avg, payload_weight_kg, battery_level,
                wind_speed_kmh, precipitation, air_traffic_density,
                drone_max_speed, start_time
            )
            
            if self.enable_debug:
                self.logger.debug("Rule-based prediction used (model not trained)")
        
        # Apply historical adjustment
        prediction = self._apply_historical_adjustment(prediction, distance_km, 
                                                       altitude_avg, wind_speed_kmh)
        
        self.logger.info(
            "ETA prediction complete",
            eta_minutes=prediction.eta_minutes,
            confidence=prediction.confidence,
            model=prediction.model_used,
            similar_routes=prediction.similar_routes_count
        )
        
        return prediction
    
    def _predict_ml(self, distance_km, altitude_avg, altitude_variance, route_complexity,
                    temperature_c, wind_speed_kmh, wind_direction_deg, precipitation,
                    visibility_km, air_pressure_hpa, payload_weight_kg, battery_start,
                    drone_age_days, time_of_day, day_of_week, air_traffic_density,
                    drone_max_speed, start_time) -> ETAPrediction:
        """ML-based prediction"""
        
        # Prepare features
        features = np.array([[
            distance_km, altitude_avg, altitude_variance, route_complexity,
            temperature_c, wind_speed_kmh, wind_direction_deg, precipitation,
            visibility_km, air_pressure_hpa,
            payload_weight_kg, battery_start, drone_age_days,
            time_of_day, day_of_week, air_traffic_density
        ]])
        
        features_scaled = self.scaler.transform(features)
        
        # Predict
        eta_minutes = self.model.predict(features_scaled)[0]
        
        # Calculate uncertainty using tree predictions
        tree_predictions = np.array([tree.predict(features_scaled)[0] 
                                     for tree in self.model.estimators_])
        uncertainty_range = (
            float(np.percentile(tree_predictions, 10)),
            float(np.percentile(tree_predictions, 90))
        )
        
        # Get feature importance for this prediction
        feature_importance = dict(zip(self.feature_names, self.model.feature_importances_))
        
        # Calculate effective speed
        base_speed = drone_max_speed * 0.8
        effective_speed = (distance_km / eta_minutes) * 60  # km/h
        speed_reduction = ((base_speed - effective_speed) / base_speed) * 100
        
        # Estimate factor impacts (approximate)
        payload_impact = (payload_weight_kg / 10.0) * 10  # % reduction per 10kg
        altitude_impact = (altitude_avg / 1000.0) * 5  # % reduction per 1000m
        battery_impact = max(0, (50 - battery_start) / 50 * 10)  # % if battery < 50%
        weather_impact = (wind_speed_kmh / 50.0) * 15 + precipitation * 20
        traffic_impact = air_traffic_density * 10
        
        confidence = self._calculate_confidence(uncertainty_range, eta_minutes)
        
        return ETAPrediction(
            eta_minutes=round(eta_minutes, 2),
            eta_datetime=start_time + timedelta(minutes=eta_minutes),
            confidence=round(confidence, 2),
            uncertainty_range=uncertainty_range,
            base_speed_kmh=round(base_speed, 2),
            effective_speed_kmh=round(effective_speed, 2),
            speed_reduction_percent=round(speed_reduction, 2),
            payload_impact=round(payload_impact, 2),
            altitude_impact=round(altitude_impact, 2),
            battery_impact=round(battery_impact, 2),
            weather_impact=round(weather_impact, 2),
            traffic_impact=round(traffic_impact, 2),
            historical_adjustment=0.0,
            model_used='ml',
            similar_routes_count=len(self.historical_deliveries),
            feature_importance=feature_importance
        )
    
    def _predict_rule_based(self, distance_km, altitude_avg, payload_weight_kg,
                           battery_level, wind_speed_kmh, precipitation,
                           air_traffic_density, drone_max_speed, start_time) -> ETAPrediction:
        """Rule-based prediction fallback"""
        
        base_speed = drone_max_speed * 0.8
        
        # Calculate penalties
        payload_penalty = 1.0 - min(0.3, (payload_weight_kg / 10.0) * 0.1)
        altitude_penalty = 1.0 - min(0.2, (altitude_avg / 1000.0) * 0.05)
        battery_penalty = 1.0 if battery_level > 50 else max(0.7, battery_level / 50.0)
        wind_penalty = 1.0 - min(0.25, (wind_speed_kmh / 50.0) * 0.15)
        precip_penalty = 1.0 - min(0.3, precipitation * 0.2)
        traffic_penalty = 1.0 - min(0.15, air_traffic_density * 0.1)
        
        # Effective speed
        effective_speed = (base_speed * payload_penalty * altitude_penalty * 
                          battery_penalty * wind_penalty * precip_penalty * traffic_penalty)
        
        # Calculate ETA with 20% safety buffer
        eta_minutes = (distance_km / effective_speed) * 60 * 1.2
        
        # Conservative uncertainty range
        uncertainty_range = (eta_minutes * 0.85, eta_minutes * 1.25)
        
        confidence = 75.0  # Lower confidence for rule-based
        
        return ETAPrediction(
            eta_minutes=round(eta_minutes, 2),
            eta_datetime=start_time + timedelta(minutes=eta_minutes),
            confidence=confidence,
            uncertainty_range=uncertainty_range,
            base_speed_kmh=round(base_speed, 2),
            effective_speed_kmh=round(effective_speed, 2),
            speed_reduction_percent=round(((base_speed - effective_speed) / base_speed) * 100, 2),
            payload_impact=round((1 - payload_penalty) * 100, 2),
            altitude_impact=round((1 - altitude_penalty) * 100, 2),
            battery_impact=round((1 - battery_penalty) * 100, 2),
            weather_impact=round((1 - wind_penalty - precip_penalty + 1) * 100, 2),
            traffic_impact=round((1 - traffic_penalty) * 100, 2),
            historical_adjustment=0.0,
            model_used='rule_based',
            similar_routes_count=0,
            feature_importance=None
        )
    
    def _apply_historical_adjustment(self, prediction: ETAPrediction, 
                                    distance_km: float, altitude_avg: float,
                                    wind_speed_kmh: float) -> ETAPrediction:
        """Adjust prediction based on similar historical routes"""
        route_hash = self._get_route_hash(distance_km, altitude_avg, wind_speed_kmh / 50.0)
        
        if route_hash in self.route_cache and len(self.route_cache[route_hash]) >= 3:
            historical_avg = np.mean(self.route_cache[route_hash])
            historical_std = np.std(self.route_cache[route_hash])
            
            # Blend ML/rule prediction with historical average
            blend_weight = min(0.3, len(self.route_cache[route_hash]) / 20.0)
            adjusted_eta = (prediction.eta_minutes * (1 - blend_weight) + 
                          historical_avg * blend_weight)
            
            adjustment = adjusted_eta - prediction.eta_minutes
            
            # Update prediction
            prediction.eta_minutes = round(adjusted_eta, 2)
            prediction.eta_datetime = prediction.eta_datetime.replace() + timedelta(minutes=adjustment)
            prediction.historical_adjustment = round(adjustment, 2)
            prediction.similar_routes_count = len(self.route_cache[route_hash])
            
            # Improve confidence if historical data aligns
            if abs(adjustment) / prediction.eta_minutes < 0.1:
                prediction.confidence = min(98.0, prediction.confidence + 10.0)
            
            if self.enable_debug:
                self.logger.debug(
                    "Historical adjustment applied",
                    route_hash=route_hash,
                    similar_routes=len(self.route_cache[route_hash]),
                    historical_avg=round(historical_avg, 2),
                    adjustment_minutes=round(adjustment, 2)
                )
        
        return prediction
    
    def _calculate_confidence(self, uncertainty_range: Tuple[float, float], 
                            eta_minutes: float) -> float:
        """Calculate prediction confidence based on uncertainty"""
        uncertainty_percent = ((uncertainty_range[1] - uncertainty_range[0]) / eta_minutes) * 100
        
        # Higher uncertainty = lower confidence
        if uncertainty_percent < 10:
            return 95.0
        elif uncertainty_percent < 20:
            return 85.0
        elif uncertainty_percent < 30:
            return 75.0
        else:
            return 65.0
    
    def record_actual_delivery(self, prediction: ETAPrediction, 
                              actual_duration_minutes: float):
        """Record prediction error for model improvement"""
        error = abs(actual_duration_minutes - prediction.eta_minutes)
        error_percent = (error / actual_duration_minutes) * 100
        
        self.prediction_errors.append(error_percent)
        
        # Keep only recent errors (last 1000)
        if len(self.prediction_errors) > 1000:
            self.prediction_errors = self.prediction_errors[-1000:]
        
        avg_error = np.mean(self.prediction_errors)
        
        self.logger.info(
            "Actual delivery recorded",
            predicted_minutes=prediction.eta_minutes,
            actual_minutes=actual_duration_minutes,
            error_minutes=round(error, 2),
            error_percent=round(error_percent, 2),
            avg_error_percent=round(avg_error, 2)
        )
    
    def get_model_stats(self) -> Dict:
        """Get model performance statistics"""
        stats = {
            'is_trained': self.is_trained,
            'historical_deliveries': len(self.historical_deliveries),
            'unique_routes': len(self.route_cache),
            'last_retrain': self.last_retrain.isoformat() if self.last_retrain else None,
            'model_type': type(self.model).__name__,
        }
        
        if self.prediction_errors:
            stats['avg_error_percent'] = round(np.mean(self.prediction_errors), 2)
            stats['median_error_percent'] = round(np.median(self.prediction_errors), 2)
            stats['recent_predictions'] = len(self.prediction_errors)
        
        return stats

# """
# AI-powered ETA Prediction Model
# Uses regression model trained on distance, altitude, weather, drone load, battery, historical data
# """
# import numpy as np
# from sklearn.ensemble import RandomForestRegressor
# from sklearn.preprocessing import StandardScaler
# import structlog
# from typing import Dict, Optional
# from datetime import datetime, timedelta

# logger = structlog.get_logger(__name__)


# class ETAPredictor:
#     """
#     ETA prediction using lightweight ML model
#     Trained on: distance, altitude, weather, load, battery, historical averages
#     """
    
#     def __init__(self):
#         self.logger = logger.bind(namespace="routes.ai.eta_predictor")
#         self.model = None
#         self.scaler = StandardScaler()
#         self._initialize_model()
    
#     def _initialize_model(self):
#         """Initialize the ETA prediction model"""
#         self.model = RandomForestRegressor(
#             n_estimators=100,
#             max_depth=10,
#             random_state=42,
#             n_jobs=-1
#         )
        
#         # For prototype: use simple rule-based prediction
#         # In production: load pre-trained model
#         self.logger.info("ETA predictor initialized")
    
#     def predict_eta(
#         self,
#         distance_km: float,
#         altitude_avg: float = 100.0,
#         weather_factor: float = 1.0,
#         payload_weight: float = 0.0,
#         battery_level: int = 100,
#         drone_max_speed: float = 60.0,
#         historical_data: Optional[Dict] = None
#     ) -> Dict:
#         """
#         Predict ETA in minutes
        
#         Args:
#             distance_km: Total route distance
#             altitude_avg: Average altitude
#             weather_factor: Weather impact (1.0 = normal, >1.0 = slower)
#             payload_weight: Package weight in kg
#             battery_level: Current battery percentage
#             drone_max_speed: Drone max speed in km/h
#             historical_data: Optional historical delivery data
        
#         Returns:
#             Dict with 'eta_minutes', 'confidence', 'factors'
#         """
#         self.logger.info(
#             "Predicting ETA",
#             distance_km=distance_km,
#             altitude_avg=altitude_avg,
#             weather_factor=weather_factor
#         )
        
#         # Base speed calculation
#         base_speed = drone_max_speed * 0.8  # 80% of max for safety
        
#         # Adjust for payload
#         payload_penalty = 1.0 - (payload_weight / 10.0) * 0.1  # 10% reduction per 10kg
#         payload_penalty = max(0.7, payload_penalty)  # Minimum 70% speed
        
#         # Adjust for altitude
#         altitude_factor = 1.0 - (altitude_avg / 1000.0) * 0.05  # 5% reduction per 1000m
#         altitude_factor = max(0.8, altitude_factor)
        
#         # Adjust for battery (if low, slower)
#         battery_factor = 1.0 if battery_level > 50 else (battery_level / 50.0) * 0.9 + 0.1
        
#         # Effective speed
#         effective_speed = base_speed * payload_penalty * altitude_factor * battery_factor * weather_factor
        
#         # Calculate time
#         eta_minutes = (distance_km / effective_speed) * 60  # Convert hours to minutes
        
#         # Add buffer for safety (20%)
#         eta_minutes = eta_minutes * 1.2
        
#         # Confidence based on historical data if available
#         confidence = 85.0
#         if historical_data:
#             # Compare with historical average
#             hist_avg = historical_data.get('avg_duration', eta_minutes)
#             if abs(eta_minutes - hist_avg) / hist_avg < 0.2:
#                 confidence = 95.0
#             else:
#                 confidence = 75.0
        
#         result = {
#             'eta_minutes': round(eta_minutes, 2),
#             'confidence': round(confidence, 2),
#             'factors': {
#                 'base_speed_kmh': round(base_speed, 2),
#                 'effective_speed_kmh': round(effective_speed, 2),
#                 'payload_penalty': round(payload_penalty, 2),
#                 'altitude_factor': round(altitude_factor, 2),
#                 'battery_factor': round(battery_factor, 2),
#                 'weather_factor': weather_factor
#             }
#         }
        
#         self.logger.info(
#             "ETA predicted",
#             eta_minutes=result['eta_minutes'],
#             confidence=result['confidence']
#         )
        
#         return result
    
#     def predict_eta_datetime(
#         self,
#         start_time: datetime,
#         distance_km: float,
#         **kwargs
#     ) -> datetime:
#         """
#         Predict ETA as datetime
        
#         Args:
#             start_time: When the delivery starts
#             distance_km: Route distance
#             **kwargs: Additional parameters for predict_eta
        
#         Returns:
#             Estimated arrival datetime
#         """
#         eta_result = self.predict_eta(distance_km, **kwargs)
#         eta_minutes = eta_result['eta_minutes']
#         return start_time + timedelta(minutes=eta_minutes)

