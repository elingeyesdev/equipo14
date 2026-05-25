import 'dart:async';

import 'dart:convert';

import 'package:app_alertas/services/location_service.dart';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:http/http.dart' as http;

const _kMapboxAccessToken =
    'pk.eyJ1IjoiZWxvam9zZGVhcnJveiIsImEiOiJjbW5lbjNoZm4wMTRoMnNxM2RuZG1jdm9uIn0.nErIU6_OLUsQyg77y6geKA';

String _mapboxDarkTileUrl() =>
    'https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/256/{z}/{x}/{y}'
    '?access_token=$_kMapboxAccessToken';

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

class _MapRouteScreenState extends State<MapRouteScreen> {
  final _locationService = const LocationService();
  final _mapController = MapController();
  LatLng? _currentLocation;
  String? _locationError;
  StreamSubscription<LatLng>? _locationSubscription;
  bool _isFollowingRoute = false;
  List<LatLng> _routePoints = [];
  bool _isLoadingRoute = false;
  DateTime? _lastRouteUpdate;

  LatLng get _incidentLocation => LatLng(widget.latitude, widget.longitude);

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
        '&access_token=$_kMapboxAccessToken',
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

  @override
  void initState() {
    super.initState();
    _loadCurrentLocation();
  }

  @override
  void dispose() {
    _locationSubscription?.cancel();
    super.dispose();
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
    
    // Evitar el error de "FlutterMap not rendered" esperando al siguiente frame
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

  Future<void> _toggleRouteTracking() async {
    if (_isFollowingRoute) {
      await _locationSubscription?.cancel();
      _locationSubscription = null;
      if (!mounted) return;
      setState(() {
        _isFollowingRoute = false;
      });
      _fitRouteInView(); // Volver a mostrar toda la ruta cuando se detiene
      return;
    }

    try {
      if (!mounted) return;
      setState(() {
        _isFollowingRoute = true;
      });
      
      // Zoom inicial estilo Google Maps (acercar a la posición actual)
      if (_currentLocation != null) {
        _mapController.move(_currentLocation!, 16);
      }

      final stream = await _locationService.getLocationStream();
      _locationSubscription = stream.listen(
        (position) {
          if (!mounted) return;
          setState(() {
            _currentLocation = position;
            _locationError = null;
          });
          
          if (_isFollowingRoute) {
            _mapController.move(position, 16);

            final now = DateTime.now();

            final shouldRefreshRoute =
                _lastRouteUpdate == null ||
                now.difference(_lastRouteUpdate!).inSeconds >= 5;

            if (shouldRefreshRoute && !_isLoadingRoute) {
              _lastRouteUpdate = now;
              _fetchRoute();
            }
          }
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
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final hasCurrentLocation = _currentLocation != null;
    final initialCenter = hasCurrentLocation
        ? _currentLocation!
        : _incidentLocation;
    final points = _routePoints;
    return Scaffold(
      appBar: AppBar(title: const Text('Ruta al incidente')),
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
                TileLayer(
                  urlTemplate: _mapboxDarkTileUrl(),
                  userAgentPackageName: 'com.tuempresa.appalertas.app_alertas',
                  maxNativeZoom: 22,
                  maxZoom: 22,
                ),
                if (_routePoints.isNotEmpty)
                  PolylineLayer(
                    polylines: [
                      Polyline(
                        points: points,
                        strokeWidth: 8,
                        color: _isLoadingRoute
                            ? Colors.grey
                            : Colors.blueAccent,
                        strokeCap: StrokeCap.round,
                        strokeJoin: StrokeJoin.round,
                      ),
                    ],
                  ),
                MarkerLayer(
                  markers: [
                    if (hasCurrentLocation)
                      Marker(
                        point: _currentLocation!,
                        width: 60,
                        height: 60,
                        child: const Icon(
                          Icons.my_location,
                          color: Colors.lightBlueAccent,
                          size: 38,
                        ),
                      ),
                    Marker(
                      point: _incidentLocation,
                      width: 60,
                      height: 60,
                      child: const Icon(
                        Icons.location_on,
                        color: Colors.redAccent,
                        size: 44,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            color: const Color(0xFF0D1015),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Tipo: ${widget.type}',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'Descripcion: ${widget.description}',
                  style: const TextStyle(color: Colors.white70, fontSize: 14),
                ),
                if (_locationError != null) ...[
                  const SizedBox(height: 8),
                  Text(
                    _locationError!,
                    style: const TextStyle(color: Colors.orangeAccent),
                  ),
                ],
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: _toggleRouteTracking,
                    icon: const Icon(Icons.navigation),
                    label: Text(
                      _isFollowingRoute
                          ? 'DETENER SEGUIMIENTO'
                          : 'INICIAR NAVEGACION EN APP',
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



