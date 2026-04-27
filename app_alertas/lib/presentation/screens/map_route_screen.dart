import 'dart:async';

import 'package:app_alertas/data/services/location_service.dart';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

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

  LatLng get _incidentLocation => LatLng(widget.latitude, widget.longitude);

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
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _locationError = e.toString();
      });
    }
  }

  void _fitRouteInView() {
    if (_currentLocation == null) return;
    _mapController.fitCamera(
      CameraFit.coordinates(
        coordinates: [_currentLocation!, _incidentLocation],
        padding: const EdgeInsets.all(40),
      ),
    );
  }

  Future<void> _toggleRouteTracking() async {
    if (_isFollowingRoute) {
      await _locationSubscription?.cancel();
      _locationSubscription = null;
      if (!mounted) return;
      setState(() {
        _isFollowingRoute = false;
      });
      return;
    }

    try {
      final stream = await _locationService.getLocationStream();
      _locationSubscription = stream.listen(
        (position) {
          if (!mounted) return;
          setState(() {
            _currentLocation = position;
            _locationError = null;
          });
          _fitRouteInView();
        },
        onError: (error) {
          if (!mounted) return;
          setState(() {
            _locationError = error.toString();
            _isFollowingRoute = false;
          });
        },
      );

      if (!mounted) return;
      setState(() {
        _isFollowingRoute = true;
      });
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
    final points = hasCurrentLocation
        ? <LatLng>[_currentLocation!, _incidentLocation]
        : <LatLng>[_incidentLocation];

    return Scaffold(
      appBar: AppBar(title: const Text('Ruta al incidente')),
      body: Column(
        children: [
          Expanded(
            child: FlutterMap(
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
                        strokeWidth: 5,
                        color: Colors.blueAccent,
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
