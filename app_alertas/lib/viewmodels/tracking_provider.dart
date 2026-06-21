import 'dart:async';
import 'dart:convert';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:latlong2/latlong.dart';
import 'package:http/http.dart' as http;

import 'package:app_alertas/services/location_service.dart';
import 'package:app_alertas/services/tracking_service.dart';
import 'package:app_alertas/services/route_notify_service.dart';
import 'package:app_alertas/core/config/mapbox_config.dart';
import 'package:app_alertas/core/network/dio_client.dart';

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
  final RouteNotifyService _routeNotifyService = RouteNotifyService();

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
  int? _reportId;
  int? _nearestStationId;
  LatLng? _nearestStationCoords;
  int? _dispatchId;
  String? _profileType;

  // Subscriptions & Timers
  StreamSubscription<PositionWithBearing>? _positionSubscription;
  Timer? _trackingTimer;

  // Getters
  bool get isFollowingRoute => _isFollowingRoute;
  LatLng? get currentLocation => _currentLocation;
  String? get locationError => _locationError;
  List<LatLng> get routePoints => List.unmodifiable(_routePoints);
  bool get isLoadingRoute => _isLoadingRoute;
  double get bearing => _bearing;
  bool get hasArrived => _hasArrived;

  double? get incidentLatitude => _incidentLatitude;
  double? get incidentLongitude => _incidentLongitude;
  String? get incidentDescription => _incidentDescription;
  String? get incidentType => _incidentType;
  int? get reportId => _reportId;
  String? get userId => _userId;
  int? get nearestStationId => _nearestStationId;
  LatLng? get nearestStationCoords => _nearestStationCoords;
  int? get dispatchId => _dispatchId;
  String? get profileType => _profileType;

  static const double _arrivalThresholdMeters = 20.0;

  TrackingProvider();

  Future<bool> fetchRoute() async {
    if (_currentLocation == null ||
        _incidentLatitude == null ||
        _incidentLongitude == null) {
      _locationError = 'Ubicación o destino no disponible.';
      notifyListeners();
      return false;
    }

    _isLoadingRoute = true;
    _locationError = null;
    notifyListeners();

    final start = _currentLocation!;
    final waypoint = LatLng(_incidentLatitude!, _incidentLongitude!);
    var success = false;

    try {
      final token = MapboxConfig.accessToken;
      if (token.isEmpty) {
        throw Exception('Token de Mapbox no configurado.');
      }

      final String coordsString;
      if (_nearestStationCoords != null) {
        coordsString =
            '${start.longitude},${start.latitude};'
            '${waypoint.longitude},${waypoint.latitude};'
            '${_nearestStationCoords!.longitude},${_nearestStationCoords!.latitude}';
      } else {
        coordsString =
            '${start.longitude},${start.latitude};'
            '${waypoint.longitude},${waypoint.latitude}';
      }

      final url = Uri.parse(
        'https://api.mapbox.com/directions/v5/mapbox/driving/'
        '$coordsString'
        '?alternatives=false'
        '&geometries=geojson'
        '&overview=full'
        '&steps=true'
        '&access_token=$token',
      );

      final response = await http.get(url).timeout(const Duration(seconds: 20));

      if (response.statusCode == 200) {
        final data = json.decode(response.body) as Map<String, dynamic>;
        final routes = data['routes'] as List<dynamic>?;
        if (routes != null && routes.isNotEmpty) {
          final geometry =
              routes[0]['geometry']['coordinates'] as List<dynamic>;
          _routePoints = geometry
              .map((coord) => LatLng(coord[1] as double, coord[0] as double))
              .toList();
          success = _routePoints.isNotEmpty;
        } else {
          _locationError = 'Mapbox no devolvió una ruta válida.';
        }
      } else {
        _locationError =
            'Error al obtener ruta (${response.statusCode}). Revisa conexión.';
        debugPrint('Mapbox directions error: ${response.statusCode} ${response.body}');
      }
    } catch (e) {
      _locationError = 'No se pudo calcular la ruta: $e';
      debugPrint('Error fetching route in TrackingProvider: $e');
    } finally {
      if (_routePoints.isEmpty) {
        _routePoints = _nearestStationCoords != null
            ? [start, waypoint, _nearestStationCoords!]
            : [start, waypoint];
        success = true;
      }
      _isLoadingRoute = false;
      notifyListeners();
    }

    return success;
  }

  static bool sameCoords(double? a, double? b) {
    if (a == null || b == null) return false;
    return (a - b).abs() < 0.00001;
  }

  bool isSameIncident(double lat, double lng) {
    return sameCoords(_incidentLatitude, lat) && sameCoords(_incidentLongitude, lng);
  }

  Future<void> _publishTrackingState(String userId, {required String status}) async {
    if (_currentLocation == null ||
        _incidentLatitude == null ||
        _incidentLongitude == null) {
      return;
    }

    final routeCoordinates = _routePoints
        .map((p) => {'lat': p.latitude, 'lng': p.longitude})
        .toList();

    await _trackingService.startTracking(userId, {
      'latitude': _currentLocation!.latitude,
      'longitude': _currentLocation!.longitude,
      'incidentLatitude': _incidentLatitude,
      'incidentLongitude': _incidentLongitude,
      if (_reportId != null) 'reportId': _reportId,
      'type': _incidentType ?? '',
      'description': _incidentType ?? '',
      'route': routeCoordinates,
      'status': status,
      'profileType': _profileType,
    });

    if (routeCoordinates.length >= 2 &&
        (status == 'active' || status == 'planned')) {
      unawaited(
        _routeNotifyService.notifyUsersAlongRoute(
          route: _routePoints,
          incidentType: _incidentType,
          description: _incidentDescription,
          reportId: _reportId,
        ),
      );
    }
  }

  Future<bool> preparePreTracking({
    required double lat,
    required double lng,
    String? type,
    String? description,
    String? userId,
    int? reportId,
    int? nearestStationId,
    LatLng? nearestStationCoords,
    String? profileType,
  }) async {
    if (_isFollowingRoute) {
      await stopRouteTracking();
    }

    _incidentLatitude = lat;
    _incidentLongitude = lng;
    _incidentType = type;
    _incidentDescription = description;
    _reportId = reportId;
    _userId = userId;
    _nearestStationId = nearestStationId;
    _nearestStationCoords = nearestStationCoords;
    _profileType = profileType;
    _hasArrived = false;
    _routePoints = [];
    _locationError = null;
    notifyListeners();

    try {
      _isLoadingRoute = true;
      notifyListeners();

      final current = await _locationService
          .getCurrentLocation()
          .timeout(const Duration(seconds: 25));
      _currentLocation = current;
      notifyListeners();

      final ok = await fetchRoute();
      if (ok && userId != null && userId.isNotEmpty) {
        try {
          await _publishTrackingState(userId, status: 'planned');
        } catch (e) {
          debugPrint('No se pudo guardar ruta via WebSockets: $e');
          _locationError =
              'Ruta trazada, pero el servidor no la aceptó.';
        }
      } else if (ok) {
        debugPrint('Ruta trazada pero no se guardó: userId vacío');
      }
      return ok;
    } on LocationException catch (e) {
      _locationError = e.message;
      notifyListeners();
      return false;
    } catch (e) {
      _locationError = 'No se pudo obtener tu ubicación. Activa el GPS.';
      debugPrint('preparePreTracking location error: $e');
      notifyListeners();
      return false;
    } finally {
      _isLoadingRoute = false;
      notifyListeners();
    }
  }

  Future<void> _updateDispatchState(String state) async {
    if (_dispatchId == null) return;
    try {
      await dioClient.dio.patch('/dispatches/$_dispatchId/state', data: {
        'state': state,
      });
      debugPrint('Despacho $_dispatchId actualizado a estado $state');
    } catch (e) {
      debugPrint('Error actualizando estado del despacho $_dispatchId: $e');
    }
  }

  Future<void> startRouteTracking({
    required double latitude,
    required double longitude,
    required String description,
    required String type,
    required String userId,
    int? reportId,
    int? nearestStationId,
    LatLng? nearestStationCoords,
    String? profileType,
  }) async {
    if (_isFollowingRoute) return;

    final keepExistingRoute = isSameIncident(latitude, longitude) && _routePoints.isNotEmpty;

    _incidentLatitude = latitude;
    _incidentLongitude = longitude;
    _incidentDescription = description;
    _incidentType = type;
    _userId = userId;
    _reportId = reportId ?? _reportId;
    _nearestStationId = nearestStationId ?? _nearestStationId;
    _nearestStationCoords = nearestStationCoords ?? _nearestStationCoords;
    _profileType = profileType;
    _isFollowingRoute = true;
    _hasArrived = false;
    if (!keepExistingRoute) {
      _routePoints = [];
    }
    notifyListeners();

    // Persistir el despacho en base de datos PostgreSQL antes de iniciar tracking de ubicacion por socket
    if (_reportId != null && _nearestStationId != null) {
      try {
        final response = await dioClient.dio.post('/dispatches', data: {
          'reportId': _reportId,
          'destinationId': _nearestStationId,
          'userId': userId,
        });
        if (response.data != null && response.data['id'] != null) {
          _dispatchId = response.data['id'] as int;
        }
        debugPrint('Despacho persistido en PostgreSQL con ID: $_dispatchId');
      } catch (e) {
        debugPrint('Error al persistir despacho en PostgreSQL: $e');
      }
    }

    // Attempt to load initial location and route before starting stream
    try {
      final initialLoc = await _locationService.getCurrentLocation();
      _currentLocation = initialLoc;
      _locationError = null;
      notifyListeners();
      if (!keepExistingRoute) {
        await fetchRoute();
      }
    } on LocationException catch (e) {
      _locationError = e.message;
    } catch (_) {
      _locationError = 'No se pudo obtener tu ubicación. Activa el GPS.';
    }

    await _publishTrackingState(userId, status: 'active');

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
              fetchRoute().then((_) {
                if (_isFollowingRoute && _userId != null) {
                  _publishTrackingState(_userId!, status: 'active');
                }
              });
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

    // Si se detiene manualmente antes de llegar a la estación final, se cancela en la BD
    if (!_hasArrived && _dispatchId != null) {
      unawaited(_updateDispatchState('cancelado'));
    }

    _dispatchId = null;
    notifyListeners();
  }

  void _checkArrival(LatLng position) {
    if (_hasArrived) return;

    // Destino final es la estación de emergencia. Si no está disponible, se asume el incidente.
    final LatLng? finalDestination = _nearestStationCoords ??
        ((_incidentLatitude != null && _incidentLongitude != null)
            ? LatLng(_incidentLatitude!, _incidentLongitude!)
            : null);

    if (finalDestination == null) return;

    final distance = _distanceInMeters(position, finalDestination);
    if (distance <= _arrivalThresholdMeters) {
      _hasArrived = true;
      notifyListeners();

      // Completar el despacho en base de datos
      if (_dispatchId != null) {
        unawaited(_updateDispatchState('completado'));
      }

      stopRouteTracking();
    }
  }

  void _updateTrackingData() {
    if (!_isFollowingRoute || _currentLocation == null || _userId == null) return;
    _publishTrackingState(_userId!, status: 'active');
  }

  Future<void> clearPreTracking() async {
    if (_userId != null && !_isFollowingRoute) {
      await _trackingService.stopTracking(_userId!);
    }
    // Cancelar despacho si se planificó pero se limpia antes de iniciar
    if (_dispatchId != null) {
      unawaited(_updateDispatchState('cancelado'));
    }
    _incidentLatitude = null;
    _incidentLongitude = null;
    _incidentDescription = null;
    _incidentType = null;
    _reportId = null;
    _userId = null;
    _nearestStationId = null;
    _nearestStationCoords = null;
    _dispatchId = null;
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
