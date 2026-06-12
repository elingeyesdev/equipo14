import 'dart:async';
import 'dart:convert';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:latlong2/latlong.dart';
import 'package:http/http.dart' as http;

import 'package:app_alertas/services/location_service.dart';
import 'package:app_alertas/services/tracking_service.dart';
import 'package:app_alertas/core/constants/api_constants.dart';

/// Calculates the distance in meters between two coordinates (Haversine formula).
double _distanceInMeters(LatLng a, LatLng b) {
  const earthRadius = 6371000.0;
  final lat1 = a.latitudeInRad;
  final lat2 = b.latitudeInRad;
  final dLat = (b.latitude - a.latitude) * math.pi / 180;
  final dLon = (b.longitude - a.longitude) * math.pi / 180;
  final x =
      math.sin(dLat / 2) * math.sin(dLat / 2) +
      math.cos(lat1) * math.cos(lat2) * math.sin(dLon / 2) * math.sin(dLon / 2);
  final c = 2 * math.atan2(math.sqrt(x), math.sqrt(1 - x));
  return earthRadius * c;
}

class TrackingProvider extends ChangeNotifier {
  final LocationService _locationService = const LocationService();
  final TrackingService _trackingService = TrackingService();

  // Active tracking state
  bool _isFollowingRoute = false;
  LatLng? _currentLocation;
  String? _locationError;
  List<LatLng> _routePoints = [];
  bool _isLoadingRoute = false;
  DateTime? _lastRouteUpdate;
  double _bearing = 0.0;
  bool _hasArrived = false;

  // Active incident parameters
  double? _incidentLatitude;
  double? _incidentLongitude;
  String? _incidentDescription;
  String? _incidentType;
  String? _userId;

  // Subscriptions & Timers
  StreamSubscription<PositionWithBearing>? _positionSubscription;
  Timer? _trackingTimer;

  // Getters
  bool get isFollowingRoute => _isFollowingRoute;
  LatLng? get currentLocation => _currentLocation;
  String? get locationError => _locationError;
  List<LatLng> get routePoints => _routePoints;
  bool get isLoadingRoute => _isLoadingRoute;
  double get bearing => _bearing;
  bool get hasArrived => _hasArrived;

  double? get incidentLatitude => _incidentLatitude;
  double? get incidentLongitude => _incidentLongitude;
  String? get incidentDescription => _incidentDescription;
  String? get incidentType => _incidentType;

  static const double _arrivalThresholdMeters = 20.0;

  TrackingProvider();

  Future<void> fetchRoute() async {
    if (_currentLocation == null || _incidentLatitude == null || _incidentLongitude == null) return;
    _isLoadingRoute = true;
    notifyListeners();

    try {
      final start = _currentLocation!;
      final end = LatLng(_incidentLatitude!, _incidentLongitude!);
      final url = Uri.parse(
        'https://api.mapbox.com/directions/v5/mapbox/driving/'
        '${start.longitude},${start.latitude};'
        '${end.longitude},${end.latitude}'
        '?alternatives=false'
        '&geometries=geojson'
        '&overview=full'
        '&steps=true'
        '&access_token=${ApiConstants.mapboxToken}',
      );

      final response = await http.get(url);

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['routes'] != null && data['routes'].isNotEmpty) {
          final geometry = data['routes'][0]['geometry']['coordinates'] as List;
          _routePoints = geometry
              .map((coord) => LatLng(coord[1] as double, coord[0] as double))
              .toList();
          notifyListeners();
        }
      }
    } catch (e) {
      debugPrint('Error fetching route in TrackingProvider: $e');
    } finally {
      _isLoadingRoute = false;
      notifyListeners();
    }
  }

  Future<void> preparePreTracking({required double lat, required double lng}) async {
    if (_isFollowingRoute) return;

    _incidentLatitude = lat;
    _incidentLongitude = lng;
    _hasArrived = false;
    _routePoints = [];
    notifyListeners();

    try {
      _isLoadingRoute = true;
      notifyListeners();
      final current = await _locationService.getCurrentLocation();
      _currentLocation = current;
      _locationError = null;
      notifyListeners();
      await fetchRoute();
    } catch (e) {
      _locationError = e.toString();
      notifyListeners();
    } finally {
      _isLoadingRoute = false;
      notifyListeners();
    }
  }

  Future<void> startRouteTracking({
    required double latitude,
    required double longitude,
    required String description,
    required String type,
    required String userId,
  }) async {
    if (_isFollowingRoute) return;

    _incidentLatitude = latitude;
    _incidentLongitude = longitude;
    _incidentDescription = description;
    _incidentType = type;
    _userId = userId;
    _isFollowingRoute = true;
    _hasArrived = false;
    _routePoints = [];
    notifyListeners();

    // Attempt to load initial location and route before starting stream
    try {
      final initialLoc = await _locationService.getCurrentLocation();
      _currentLocation = initialLoc;
      _locationError = null;
      notifyListeners();
      await fetchRoute();
    } catch (_) {}

    // Periodically send coordinates to backend
    _trackingTimer = Timer.periodic(const Duration(seconds: 3), (_) {
      _updateTrackingData();
    });
    _updateTrackingData();

    // Subscribe to position updates
    try {
      final stream = await _locationService.getPositionStream();
      _positionSubscription = stream.listen(
        (posWithBearing) {
          final position = posWithBearing.latLng;
          final currentBearing = posWithBearing.bearing;

          _currentLocation = position;
          _bearing = currentBearing;
          _locationError = null;
          notifyListeners();

          _checkArrival(position);

          if (_isFollowingRoute && !_hasArrived) {
            final now = DateTime.now();
            final shouldRefreshRoute =
                _lastRouteUpdate == null ||
                now.difference(_lastRouteUpdate!).inSeconds >= 5;

            if (shouldRefreshRoute && !_isLoadingRoute) {
              _lastRouteUpdate = now;
              fetchRoute();
            }
          }
        },
        onError: (error) {
          _locationError = error.toString();
          _isFollowingRoute = false;
          notifyListeners();
          stopRouteTracking();
        },
      );
    } catch (e) {
      _locationError = e.toString();
      _isFollowingRoute = false;
      notifyListeners();
      stopRouteTracking();
    }
  }

  Future<void> stopRouteTracking() async {
    if (!_isFollowingRoute) return;

    _isFollowingRoute = false;
    _positionSubscription?.cancel();
    _positionSubscription = null;
    _trackingTimer?.cancel();
    _trackingTimer = null;

    if (_userId != null) {
      await _trackingService.stopTracking(_userId!);
    }

    notifyListeners();
  }

  void _checkArrival(LatLng position) {
    if (_hasArrived || _incidentLatitude == null || _incidentLongitude == null) return;
    
    final distance = _distanceInMeters(position, LatLng(_incidentLatitude!, _incidentLongitude!));
    if (distance <= _arrivalThresholdMeters) {
      _hasArrived = true;
      notifyListeners();
      stopRouteTracking();
    }
  }

  void _updateTrackingData() {
    if (!_isFollowingRoute || _currentLocation == null || _userId == null) return;

    final routeCoordinates = _routePoints
        .map((p) => {'lat': p.latitude, 'lng': p.longitude})
        .toList();

    _trackingService.startTracking(_userId!, {
      'latitude': _currentLocation!.latitude,
      'longitude': _currentLocation!.longitude,
      'type': _incidentType ?? '',
      'description': _incidentDescription ?? '',
      'route': routeCoordinates,
    });
  }

  void clearPreTracking() {
    _incidentLatitude = null;
    _incidentLongitude = null;
    _incidentDescription = null;
    _incidentType = null;
    _routePoints = [];
    _hasArrived = false;
    _bearing = 0.0;
    notifyListeners();
  }

  @override
  void dispose() {
    _positionSubscription?.cancel();
    _trackingTimer?.cancel();
    super.dispose();
  }
}
