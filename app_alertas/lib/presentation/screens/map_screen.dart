import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart';
import 'package:app_alertas/data/models/alert_model.dart';
import 'package:app_alertas/data/services/alerts_api_service.dart';
import 'package:app_alertas/data/services/api_service.dart';
import 'package:app_alertas/data/services/fcm_service.dart';
import 'package:app_alertas/presentation/screens/map_route_screen.dart';
import 'package:provider/provider.dart';
import 'package:app_alertas/presentation/providers/auth_provider.dart';

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
  final _apiService = ApiService();
  final _fcmService = FcmService();
  List<AlertModel> _alerts = const [];
  bool _loadingAlerts = true;

  @override
  void initState() {
    super.initState();
    getLocation();
    _loadAlerts();
    _initPushNotifications();
  }

  Future<void> _initPushNotifications() async {
    final user = context.read<AuthProvider>().user;
    if (user != null) {
      await _fcmService.init(user.id);
      _fcmService.listenToForegroundMessages(() {
        // Recargar alertas pero NO mostrar el snackbar, ya que la notificación 
        // real del sistema aparecerá arriba en la pantalla.
        _loadAlerts();
      });
    }
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

    try {
      final user = context.read<AuthProvider>().user;
      if (user != null) {
        await _apiService.actualizarUbicacionUsuario(
          user.id,
          latitude: position.latitude,
          longitude: position.longitude,
        );
      }
    } catch (_) {
      // Ignorar error de ubicación en fondo
    }
  }

  Future<void> _loadAlerts() async {
    setState(() => _loadingAlerts = true);
    try {
      final data = await _alertsService.getAlerts();
      if (!mounted) return;
      setState(() => _alerts = data);
    } catch (e) {
      if (!mounted) return;
      debugPrint('Error al cargar alertas: $e');
    } finally {
      if (mounted) {
        setState(() => _loadingAlerts = false);
      }
    }
  }

  List<Marker> _buildAlertMarkers() {
    return _alerts
        .where((a) => a.coordinates.length >= 2)
        .map((alert) {
          final point = _toLatLng(alert.coordinates);
          if (point == null) {
            return null;
          }
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
                    color: _colorByType(alert.type),
                    size: 32,
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 6,
                      vertical: 2,
                    ),
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
            ),
          );
        })
        .whereType<Marker>()
        .toList();
  }

  void _showAlertBottomSheet(AlertModel alert) {
    final userRole = context.read<AuthProvider>().user?.roleId;
    final isAuthority = userRole == 2;
    final incidentLocation = _toLatLng(alert.coordinates);
    final canNavigate = incidentLocation != null;
    final dateLabel = alert.createdAt != null
        ? '${alert.createdAt!.day}/${alert.createdAt!.month}/${alert.createdAt!.year}'
        : 'Sin fecha';

    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF1E293B),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return Padding(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(_iconByType(alert.type), color: _colorByType(alert.type), size: 30),
                  const SizedBox(width: 10),
                  Text(
                    _labelByType(alert.type),
                    style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Text(
                alert.description,
                style: const TextStyle(color: Colors.white70, fontSize: 16),
              ),
              const SizedBox(height: 8),
              Text('Reportado: $dateLabel', style: const TextStyle(color: Colors.grey)),
              const SizedBox(height: 20),
              if (isAuthority && canNavigate)
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () {
                      Navigator.pop(context);
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => MapRouteScreen(
                            latitude: incidentLocation.latitude,
                            longitude: incidentLocation.longitude,
                            description: alert.description,
                            type: _labelByType(alert.type),
                          ),
                        ),
                      );
                    },
                    icon: const Icon(Icons.alt_route),
                    label: const Text('Ver ruta'),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }

  LatLng? _toLatLng(List<double> coordinates) {
    if (coordinates.length < 2) return null;
    final lon = coordinates[0];
    final lat = coordinates[1];
    
    // PostGIS y GeoJSON siempre devuelven [longitud, latitud]
    return LatLng(lat, lon);
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
