import 'dart:async';
import 'dart:convert';
import 'dart:math' as math;

import 'package:app_alertas/services/location_service.dart';
import 'package:app_alertas/core/config/mapbox_config.dart';
import 'package:app_alertas/core/constants/api_constants.dart';

import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:http/http.dart' as http;
import 'package:provider/provider.dart';
import 'package:app_alertas/viewmodels/auth_viewmodel.dart';
import 'package:app_alertas/services/tracking_service.dart';

/// Calcula la distancia en metros entre dos coordenadas (fórmula Haversine).
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

class MapRouteScreen extends StatefulWidget {
  const MapRouteScreen({
    super.key,
    required this.latitude,
    required this.longitude,
    required this.description,
    required this.type,
  });

  final double latitude;
  final double longitude;
  final String description;
  final String type;

  @override
  State<MapRouteScreen> createState() => _MapRouteScreenState();
}

class _MapRouteScreenState extends State<MapRouteScreen>
    with TickerProviderStateMixin {
  final _locationService = const LocationService();
  final _mapController = MapController();

  // Estado de ubicación y navegación
  LatLng? _currentLocation;
  String? _locationError;
  StreamSubscription<PositionWithBearing>? _positionSubscription;
  bool _isFollowingRoute = false;
  List<LatLng> _routePoints = [];
  bool _isLoadingRoute = false;
  DateTime? _lastRouteUpdate;

  // Tracking
  final _trackingService = TrackingService();
  Timer? _trackingTimer;

  // Animación del vehículo
  late AnimationController _vehicleAnimController;
  late Animation<double> _bearingAnimation;
  double _animatedBearing = 0.0;

  // Control de llegada al destino
  bool _hasArrived = false;

  static const double _arrivalThresholdMeters = 20.0;

  LatLng get _incidentLocation => LatLng(widget.latitude, widget.longitude);

  @override
  void initState() {
    super.initState();
    _vehicleAnimController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );
    _bearingAnimation =
        Tween<double>(begin: 0, end: 0).animate(
          CurvedAnimation(
            parent: _vehicleAnimController,
            curve: Curves.easeOut,
          ),
        )..addListener(() {
          setState(() => _animatedBearing = _bearingAnimation.value);
        });

    _loadCurrentLocation();
  }

  @override
  void dispose() {
    _positionSubscription?.cancel();
    _vehicleAnimController.dispose();
    if (_isFollowingRoute) {
      final userId = context.read<AuthViewModel>().user?.id ?? 'unknown';
      _trackingService.stopTracking(userId);
    }
    _trackingTimer?.cancel();
    super.dispose();
  }

  Future<void> _fetchRoute() async {
    if (_currentLocation == null) return;
    setState(() => _isLoadingRoute = true);

    try {
      final start = _currentLocation!;
      final end = _incidentLocation;
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
          setState(() {
            _routePoints = geometry
                .map((coord) => LatLng(coord[1] as double, coord[0] as double))
                .toList();
          });
        }
      }
    } catch (e) {
      debugPrint('Error fetching route: $e');
    } finally {
      setState(() => _isLoadingRoute = false);
    }
  }

  Future<void> _loadCurrentLocation() async {
    try {
      final current = await _locationService.getCurrentLocation();
      if (!mounted) return;
      setState(() {
        _currentLocation = current;
        _locationError = null;
      });
      _fitRouteInView();
      await _fetchRoute();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _locationError = e.toString();
      });
    }
  }

  void _fitRouteInView() {
    if (_currentLocation == null) return;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      try {
        _mapController.fitCamera(
          CameraFit.coordinates(
            coordinates: [_currentLocation!, _incidentLocation],
            padding: const EdgeInsets.all(60),
          ),
        );
      } catch (e) {
        debugPrint('MapController no está listo aún: $e');
      }
    });
  }

  /// Anima suavemente la rotación del icono del vehículo.
  void _animateBearing(double newBearing) {
    _bearingAnimation =
        Tween<double>(begin: _animatedBearing, end: newBearing).animate(
          CurvedAnimation(
            parent: _vehicleAnimController,
            curve: Curves.easeOut,
          ),
        )..addListener(() {
          if (mounted) {
            setState(() => _animatedBearing = _bearingAnimation.value);
          }
        });
    _vehicleAnimController.forward(from: 0);
  }

  /// Verifica si el usuario llegó al destino.
  void _checkArrival(LatLng position) {
    if (_hasArrived) return;
    final distance = _distanceInMeters(position, _incidentLocation);
    if (distance <= _arrivalThresholdMeters) {
      _hasArrived = true;
      _stopNavigation();
      _showArrivalDialog();
    }
  }

  void _stopNavigation() {
    _positionSubscription?.cancel();
    _positionSubscription = null;

    _trackingTimer?.cancel();
    _trackingTimer = null;
    final userId = context.read<AuthViewModel>().user?.id ?? 'unknown';
    _trackingService.stopTracking(userId);

    if (mounted) {
      setState(() => _isFollowingRoute = false);
    }
  }

  Future<void> _showArrivalDialog() async {
    if (!mounted) return;
    return showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return Dialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          backgroundColor: const Color(0xFF1A1E27),
          child: Padding(
            padding: const EdgeInsets.all(28),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Icono animado de éxito
                Container(
                  width: 72,
                  height: 72,
                  decoration: BoxDecoration(
                    color: Colors.greenAccent.withValues(alpha: 0.15),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.check_circle_rounded,
                    color: Colors.greenAccent,
                    size: 44,
                  ),
                ),
                const SizedBox(height: 20),
                const Text(
                  '¡Ha llegado a su destino!',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.5,
                  ),
                ),
                const SizedBox(height: 10),
                const Text(
                  'Ha llegado al punto de la emergencia.\nNavegación finalizada.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Color(0xFF94A3B8),
                    fontSize: 14,
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 28),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.greenAccent,
                      foregroundColor: Colors.black,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    onPressed: () => Navigator.of(context).pop(),
                    child: const Text(
                      'CERRAR',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Future<void> _toggleRouteTracking() async {
    if (_isFollowingRoute) {
      _stopNavigation();
      _fitRouteInView();
      return;
    }

    try {
      if (!mounted) return;
      setState(() => _isFollowingRoute = true);

      _trackingTimer = Timer.periodic(const Duration(seconds: 3), (_) {
        _updateTrackingData();
      });
      _updateTrackingData();

      if (_currentLocation != null) {
        _mapController.move(_currentLocation!, 17);
      }

      final stream = await _locationService.getPositionStream();
      _positionSubscription = stream.listen(
        (posWithBearing) {
          if (!mounted) return;

          final position = posWithBearing.latLng;
          final bearing = posWithBearing.bearing;

          setState(() {
            _currentLocation = position;
            _locationError = null;
          });

          // Animar la rotación del vehículo
          _animateBearing(bearing);

          if (_isFollowingRoute) {
            // Cámara centrada en el vehículo, ligeramente inclinada hacia adelante
            _mapController.move(position, 17);

            final now = DateTime.now();
            final shouldRefreshRoute =
                _lastRouteUpdate == null ||
                now.difference(_lastRouteUpdate!).inSeconds >= 5;

            if (shouldRefreshRoute && !_isLoadingRoute) {
              _lastRouteUpdate = now;
              _fetchRoute();
            }
          }

          // Verificar llegada al destino
          _checkArrival(position);
        },
        onError: (error) {
          if (!mounted) return;
          setState(() {
            _locationError = error.toString();
            _isFollowingRoute = false;
          });
        },
      );
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _locationError = e.toString();
        _isFollowingRoute = false;
      });
    }
  }

  void _updateTrackingData() {
    if (!_isFollowingRoute || _currentLocation == null) return;

    final userId = context.read<AuthViewModel>().user?.id ?? 'unknown';

    final routeCoordinates = _routePoints
        .map((p) => {'lat': p.latitude, 'lng': p.longitude})
        .toList();

    _trackingService.startTracking(userId, {
      'latitude': _currentLocation!.latitude,
      'longitude': _currentLocation!.longitude,
      'type': widget.type,
      'description': widget.description,
      'route': routeCoordinates,
    });
  }

  /// Elige el icono de vehículo según el tipo de emergencia.
  IconData _vehicleIcon() {
    final t = widget.type.toLowerCase();
    if (t.contains('ambulancia') ||
        t.contains('medic') ||
        t.contains('salud')) {
      return Icons.local_hospital_rounded;
    }
    if (t.contains('bombero') || t.contains('incendio')) {
      return Icons.local_fire_department_rounded;
    }
    return Icons.directions_car_rounded;
  }

  @override
  Widget build(BuildContext context) {
    final hasCurrentLocation = _currentLocation != null;
    final initialCenter = hasCurrentLocation
        ? _currentLocation!
        : _incidentLocation;
    final points = _routePoints;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Ruta al incidente'),
        actions: [
          if (_isLoadingRoute)
            const Padding(
              padding: EdgeInsets.only(right: 16),
              child: Center(
                child: SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
              ),
            ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: FlutterMap(
              mapController: _mapController,
              options: MapOptions(
                initialCenter: initialCenter,
                initialZoom: 14,
              ),
              children: [
                MapboxConfig.darkTileLayer(),

                // Polilínea de la ruta
                if (points.isNotEmpty)
                  PolylineLayer(
                    polylines: [
                      Polyline(
                        points: points,
                        strokeWidth: 6,
                        color: _isLoadingRoute
                            ? Colors.grey
                            : const Color(0xFFAF6D58),
                        strokeCap: StrokeCap.round,
                        strokeJoin: StrokeJoin.round,
                      ),
                    ],
                  ),

                MarkerLayer(
                  markers: [
                    // Marcador de destino (incidente)
                    Marker(
                      point: _incidentLocation,
                      width: 64,
                      height: 64,
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 36,
                            height: 36,
                            decoration: BoxDecoration(
                              color: Color(0xFFAF3C32),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.flag_rounded,
                              color: Colors.white,
                              size: 20,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Container(
                            width: 4,
                            height: 10,
                            decoration: BoxDecoration(
                              color: Colors.redAccent,
                              borderRadius: BorderRadius.circular(2),
                            ),
                          ),
                        ],
                      ),
                    ),

                    // Marcador del vehículo (usuario) con rotación según bearing
                    if (hasCurrentLocation)
                      Marker(
                        point: _currentLocation!,
                        width: 56,
                        height: 56,
                        child: Transform.rotate(
                          angle: _animatedBearing * math.pi / 180,
                          child: Container(
                            width: 48,
                            height: 48,
                            decoration: BoxDecoration(
                              color: const Color(0xFFAF6D58),
                              shape: BoxShape.circle,
                            ),
                            child: Icon(
                              _isFollowingRoute
                                  ? _vehicleIcon()
                                  : Icons.my_location_rounded,
                              color: Colors.white,
                              size: 26,
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),

          // Panel inferior de información
          Container(
            width: double.infinity,
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 20),
            decoration: const BoxDecoration(
              color: Color(0xFF262624),
              border: Border(
                top: BorderSide(color: Color(0xFF1E2330), width: 1),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.redAccent.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: Colors.redAccent.withValues(alpha: 0.4),
                        ),
                      ),
                      child: Text(
                        widget.type,
                        style: const TextStyle(
                          color: Colors.redAccent,
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  widget.description,
                  style: const TextStyle(color: Colors.white70, fontSize: 14),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                if (_locationError != null) ...[
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(
                        Icons.warning_amber_rounded,
                        color: Colors.orangeAccent,
                        size: 16,
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          _locationError!,
                          style: const TextStyle(
                            color: Colors.orangeAccent,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
                const SizedBox(height: 14),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      backgroundColor: _isFollowingRoute
                          ? Color(0xFFAF3C32)
                          : const Color(0xFFAF6D58),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    onPressed: _hasArrived ? null : _toggleRouteTracking,
                    icon: Icon(
                      _isFollowingRoute
                          ? Icons.stop_rounded
                          : Icons.navigation_rounded,
                    ),
                    label: Text(
                      _hasArrived
                          ? 'LLEGÓ AL DESTINO'
                          : _isFollowingRoute
                          ? 'DETENER SEGUIMIENTO'
                          : 'INICIAR NAVEGACIÓN',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.8,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
