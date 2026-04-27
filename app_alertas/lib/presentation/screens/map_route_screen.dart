import 'dart:async';

import 'dart:convert';

import 'package:app_alertas/data/services/location_service.dart';
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

  LatLng get _incidentLocation => LatLng(widget.latitude, widget.longitude);

  Future<void> _fetchRoute() async {
    if (_currentLocation == null) return;
    setState(() => _isLoadingRoute = true);

    try {
      final start = _currentLocation!;
      final end = _incidentLocation;
      // Usamos OSRM público para obtener la ruta de conducción
      final url = Uri.parse(
          'https://router.project-osrm.org/route/v1/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?geometries=geojson');

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
        _mapController.move(_currentLocation!, 17.5);
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
             // Seguir al usuario constantemente estilo Google Maps
            _mapController.move(position, 17.5);
            // Idealmente aquí podríamos comprobar si se salió de la ruta y llamar a _fetchRoute()
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
    
    // Si tenemos puntos de la ruta generados por OSRM, los usamos. 
    // Si no (ej. mientras carga), usamos una línea recta como fallback.
    final points = _routePoints.isNotEmpty
        ? _routePoints
        : (hasCurrentLocation
            ? <LatLng>[_currentLocation!, _incidentLocation]
            : <LatLng>[_incidentLocation]);

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
                if (hasCurrentLocation)
                  PolylineLayer(
                    polylines: [
                      Polyline(
                        points: points,
                        strokeWidth: 6,
                        color: _isLoadingRoute ? Colors.grey : Colors.blueAccent,
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
            color: const Color(0xFF0F172A),
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
