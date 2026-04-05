import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart';
import 'package:app_alertas/data/models/alert_model.dart';
import 'package:app_alertas/data/services/alerts_api_service.dart';

/// Token público Mapbox (mismo que en AndroidManifest MAPBOX_ACCESS_TOKEN).
/// Si ves mapa gris: revisa cuota, caducidad o restricciones URL en mapbox.com/account.
const _kMapboxAccessToken =
    'pk.eyJ1IjoiZWxvam9zZGVhcnJveiIsImEiOiJjbW5lbjNoZm4wMTRoMnNxM2RuZG1jdm9uIn0.nErIU6_OLUsQyg77y6geKA';

/// Raster tiles: debe incluir `/256/` o `/512/` antes de `{z}/{x}/{y}` (Static Tiles API).
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
  List<AlertModel> _alerts = const [];
  bool _loadingAlerts = true;

  @override
  void initState() {
    super.initState();
    getLocation();
    _loadAlerts();
  }

  Future getLocation() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) return;

    LocationPermission permission = await Geolocator.requestPermission();
    if (permission == LocationPermission.denied) return;

    Position position = await Geolocator.getCurrentPosition();

    setState(() {
      currentLocation = LatLng(position.latitude, position.longitude);
    });
  }

  Future<void> _loadAlerts() async {
    setState(() => _loadingAlerts = true);
    try {
      final data = await _alertsService.getAlerts();
      if (!mounted) return;
      setState(() => _alerts = data);
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No se pudieron cargar las alertas')),
      );
    } finally {
      if (mounted) {
        setState(() => _loadingAlerts = false);
      }
    }
  }

  List<Marker> _buildAlertMarkers() {
    return _alerts.where((a) => a.coordinates.length >= 2).map((alert) {
      final lon = alert.coordinates[0];
      final lat = alert.coordinates[1];
      return Marker(
        point: LatLng(lat, lon),
        width: 120,
        height: 56,
        child: Column(
          children: [
            Icon(
              _iconByType(alert.type),
              color: _colorByType(alert.type),
              size: 32,
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: Colors.black87,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                _labelByType(alert.type),
                style: const TextStyle(fontSize: 11, color: Colors.white),
              ),
            ),
          ],
        ),
      );
    }).toList();
  }

  IconData _iconByType(String type) {
    switch (type.toLowerCase()) {
      case 'robo':
        return Icons.gpp_maybe;
      case 'incendio':
        return Icons.local_fire_department;
      case 'accidente':
        return Icons.car_crash;
      default:
        return Icons.warning;
    }
  }

  Color _colorByType(String type) {
    switch (type.toLowerCase()) {
      case 'robo':
        return Colors.redAccent;
      case 'incendio':
        return Colors.orangeAccent;
      case 'accidente':
        return Colors.lightBlueAccent;
      default:
        return Colors.yellowAccent;
    }
  }

  String _labelByType(String type) {
    switch (type.toLowerCase()) {
      case 'robo':
        return 'Robo';
      case 'incendio':
        return 'Incendio';
      case 'accidente':
        return 'Accidente';
      default:
        return type;
    }
  }

  @override
  Widget build(BuildContext context) {
    final alertMarkers = _buildAlertMarkers();
    return Scaffold(
      body: currentLocation == null
          ? const Center(child: CircularProgressIndicator())
          : FlutterMap(
              options: MapOptions(
                initialCenter: currentLocation!,
                initialZoom: 15,
                maxZoom: 22,
              ),
              children: [
                TileLayer(
                  urlTemplate: _mapboxDarkTileUrl(),
                  userAgentPackageName: 'com.tuempresa.appalertas.app_alertas',
                  maxNativeZoom: 22,
                  maxZoom: 22,
                ),
                MarkerLayer(
                  markers: [
                    ...alertMarkers,
                    Marker(
                      point: currentLocation!,
                      width: 50,
                      height: 50,
                      child: const Icon(
                        Icons.my_location,
                        color: Colors.blue,
                        size: 40,
                      ),
                    ),
                  ],
                ),
              ],
            ),
      floatingActionButton: FloatingActionButton(
        onPressed: _loadingAlerts ? null : _loadAlerts,
        child: _loadingAlerts
            ? const SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(strokeWidth: 2),
              )
            : const Icon(Icons.refresh),
      ),
    );
  }
}
