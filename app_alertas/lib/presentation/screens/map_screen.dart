import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart';
import 'package:app_alertas/data/models/alert_model.dart';
import 'package:app_alertas/data/services/alerts_api_service.dart';
import 'package:app_alertas/data/services/api_service.dart';
import 'package:app_alertas/data/services/fcm_service.dart';
import 'package:provider/provider.dart';
import 'package:app_alertas/presentation/providers/auth_provider.dart';
import 'package:app_alertas/presentation/screens/alert_card.dart';

/// Token público Mapbox
const _kMapboxAccessToken =
    'pk.eyJ1IjoiZWxvam9zZGVhcnJveiIsImEiOiJjbW5lbjNoZm4wMTRoMnNxM2RuZG1jdm9uIn0.nErIU6_OLUsQyg77y6geKA';

/// Raster tiles
String _mapboxDarkTileUrl() =>
    'https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/256/{z}/{x}/{y}'
    '?access_token=$_kMapboxAccessToken';

class MapScreen extends StatefulWidget {
  const MapScreen({super.key});

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  LatLng? currentLocation;
  final _alertsService = AlertsApiService();
  final _apiService = ApiService();
  final _fcmService = FcmService();
  List<AlertModel> _alerts = const [];
  bool _loadingAlerts = true;

  @override
  void initState() {
    super.initState();
    getLocation();
    _initPushNotifications();
  }

  Future<void> _initPushNotifications() async {
    final user = context.read<AuthProvider>().user;
    if (user != null) {
      await _fcmService.init(user.id);
      _fcmService.listenToForegroundMessages(() {
        _loadNearbyAlerts();
      });
    }
  }

  Future getLocation() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) return;

    LocationPermission permission = await Geolocator.requestPermission();
    if (permission == LocationPermission.denied) return;

    Position position = await Geolocator.getCurrentPosition();

    if (!mounted) return;
    setState(() {
      currentLocation = LatLng(position.latitude, position.longitude);
    });

    try {
      final user = context.read<AuthProvider>().user;
      if (user != null) {
        await _apiService.actualizarUbicacionUsuario(
          user.id,
          latitude: position.latitude,
          longitude: position.longitude,
        );
      }
    } catch (_) {}

    await _loadNearbyAlerts();
  }

  Future<void> _loadNearbyAlerts() async {
    if (!mounted || currentLocation == null) return;
    setState(() => _loadingAlerts = true);
    try {
      final data = await _alertsService.getNearbyAlerts(
        latitude: currentLocation!.latitude,
        longitude: currentLocation!.longitude,
        radius: 150,
      );
      if (!mounted) return;
      setState(() => _alerts = data);
    } catch (e) {
      debugPrint('Error al cargar alertas cercanas: $e');
      try {
        final data = await _alertsService.getAlerts();
        if (!mounted) return;
        setState(() => _alerts = data);
      } catch (_) {}
    } finally {
      if (mounted) setState(() => _loadingAlerts = false);
    }
  }

  List<Marker> _buildAlertMarkers() {
    return _alerts
        .where((a) => a.coordinates.length >= 2)
        .map((alert) {
          final point = _toLatLng(alert.coordinates);
          if (point == null) return null;

          Color color = alert.verified ? Colors.green : _colorByType(alert.type);

          return Marker(
            point: point,
            width: 120,
            height: 56,
            child: GestureDetector(
              onTap: () => _showAlertBottomSheet(alert),
              child: Column(
                children: [
                  Icon(
                    _iconByType(alert.type),
                    color: color,
                    size: 32,
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.black87,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      alert.type.toUpperCase(),
                      style: const TextStyle(fontSize: 11, color: Colors.white),
                    ),
                  ),
                ],
              ),
            ),
          );
        })
        .whereType<Marker>()
        .toList();
  }

  void _showAlertBottomSheet(AlertModel alert) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) {
        return Padding(
          padding: const EdgeInsets.all(8.0),
          child: Wrap(
            children: [
              AlertCard(alert: alert),
            ],
          ),
        );
      },
    );
  }

  LatLng? _toLatLng(List<double> coordinates) {
    if (coordinates.length < 2) return null;
    return LatLng(coordinates[1], coordinates[0]);
  }

  IconData _iconByType(String type) {
    switch (type.toLowerCase()) {
      case 'robo': return Icons.warning;
      case 'incendio': return Icons.local_fire_department;
      case 'accidente': return Icons.car_crash;
      default: return Icons.warning;
    }
  }

  Color _colorByType(String type) {
    switch (type.toLowerCase()) {
      case 'robo': return Colors.red;
      case 'incendio': return Colors.orange;
      case 'accidente': return Colors.blue;
      default: return Colors.yellow;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: currentLocation == null
          ? const Center(child: CircularProgressIndicator())
          : FlutterMap(
              options: MapOptions(
                initialCenter: currentLocation!,
                initialZoom: 17,
                maxZoom: 22,
              ),
              children: [
                TileLayer(
                  urlTemplate: _mapboxDarkTileUrl(),
                  userAgentPackageName: 'com.tuempresa.appalertas',
                  maxNativeZoom: 22,
                  maxZoom: 22,
                ),
                MarkerLayer(
                  markers: [
                    ..._buildAlertMarkers(),
                    Marker(
                      point: currentLocation!,
                      width: 40,
                      height: 40,
                      child: const Icon(Icons.my_location, color: Colors.blue, size: 30),
                    ),
                  ],
                ),
              ],
            ),
      floatingActionButton: FloatingActionButton(
        onPressed: _loadNearbyAlerts,
        child: _loadingAlerts
            ? const CircularProgressIndicator(color: Colors.white)
            : const Icon(Icons.refresh),
      ),
    );
  }
}
