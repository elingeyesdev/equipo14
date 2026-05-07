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
  final AlertModel? initialAlert;
  const MapScreen({super.key, this.initialAlert});

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  LatLng? currentLocation;
  MapController mapController = MapController();
  final _alertsService = AlertsApiService();
  final _apiService = ApiService();
  final _fcmService = FcmService();
  List<AlertModel> _alerts = const [];
  bool _loadingAlerts = true;
  bool _isAuthority = false;

  @override
  void initState() {
    super.initState();
    // Detectar rol antes de cargar
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final user = context.read<AuthProvider>().user;
      _isAuthority = (user?.roleId == 2) ||
          (user?.roleName?.toLowerCase().contains('autoridad') == true);
    });
    getLocation();
    _initPushNotifications();
    if (widget.initialAlert != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _showAlertBottomSheet(widget.initialAlert!);
      });
    }
  }

  Future<void> _initPushNotifications() async {
    final user = context.read<AuthProvider>().user;
    if (user != null) {
      _isAuthority = (user.roleId == 2) ||
          (user.roleName?.toLowerCase().contains('autoridad') == true);
      await _fcmService.init(user.id);
      _fcmService.listenToForegroundMessages(() {
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

    await _loadAlerts();
  }

  Future<void> _loadAlerts() async {
    if (!mounted) return;
    setState(() => _loadingAlerts = true);
    try {
      List<AlertModel> data;
      if (_isAuthority) {
        // Autoridades ven TODOS los reportes de la ciudad
        data = await _alertsService.getAlerts();
      } else {
        // Usuarios normales ven reportes cercanos (5km de radio)
        if (currentLocation == null) {
          setState(() => _loadingAlerts = false);
          return;
        }
        data = await _alertsService.getNearbyAlerts(
          latitude: currentLocation!.latitude,
          longitude: currentLocation!.longitude,
          radius: 5000,
        );
      }
      if (!mounted) return;
      setState(() => _alerts = data);
    } catch (e) {
      debugPrint('Error al cargar alertas: $e');
      // Fallback: intentar cargar todos
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
            height: 80,
            child: GestureDetector(
              onTap: () => _showAlertBottomSheet(alert),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    _iconByType(alert.type),
                    color: color,
                    size: 36,
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0F172A),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: color.withValues(alpha: 0.3)),
                    ),
                    child: Text(
                      alert.type.toUpperCase(),
                      textAlign: TextAlign.center,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 9,
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
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
    final t = type.toLowerCase();
    if (t.contains('robo')) return Icons.security_rounded;
    if (t.contains('hurto')) return Icons.person_off_rounded;
    if (t.contains('incendio')) return Icons.local_fire_department_rounded;
    if (t.contains('accidente')) return Icons.car_crash_rounded;
    if (t.contains('vial') || t.contains('obstrucción')) return Icons.traffic_rounded;
    if (t.contains('médica') || t.contains('salud')) return Icons.medical_services_rounded;
    return Icons.warning_amber_rounded;
  }

  Color _colorByType(String type) {
    final t = type.toLowerCase();
    if (t.contains('robo') || t.contains('hurto')) return const Color(0xFFEF4444);
    if (t.contains('incendio')) return const Color(0xFFF59E0B);
    if (t.contains('accidente') || t.contains('vial')) return const Color(0xFF3B82F6);
    if (t.contains('médica') || t.contains('salud')) return const Color(0xFF10B981);
    return const Color(0xFF8B5CF6);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          currentLocation == null
              ? const Center(child: CircularProgressIndicator())
              : FlutterMap(
                  mapController: mapController,
                  options: MapOptions(
                    initialCenter: widget.initialAlert != null &&
                            widget.initialAlert!.coordinates.length >= 2
                        ? LatLng(widget.initialAlert!.coordinates[1],
                            widget.initialAlert!.coordinates[0])
                        : currentLocation!,
                    initialZoom: widget.initialAlert != null ? 18 : 13,
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
                        if (currentLocation != null)
                          Marker(
                            point: currentLocation!,
                            width: 40,
                            height: 40,
                            child: const Icon(Icons.my_location,
                                color: Colors.blue, size: 30),
                          ),
                      ],
                    ),
                  ],
                ),

          // Badge de modo autoridad
          if (_isAuthority)
            Positioned(
              top: 12,
              left: 0,
              right: 0,
              child: Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1E293B).withOpacity(0.92),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFF3B82F6).withOpacity(0.5)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.shield_rounded,
                          color: Color(0xFF3B82F6), size: 15),
                      const SizedBox(width: 6),
                      Text(
                        'Vista autoridad · ${_alerts.length} reportes',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _loadAlerts,
        child: _loadingAlerts
            ? const CircularProgressIndicator(color: Colors.white)
            : const Icon(Icons.refresh),
      ),
    );
  }
}
