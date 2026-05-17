import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart';
import 'package:app_alertas/models/alert_model.dart';
import 'package:app_alertas/repositories/user_repository.dart';
import 'package:app_alertas/viewmodels/alert_viewmodel.dart';
import 'package:app_alertas/services/fcm_service.dart';
import 'package:provider/provider.dart';
import 'package:app_alertas/viewmodels/auth_viewmodel.dart';
import 'package:app_alertas/views/alert_card.dart';

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
  State<MapScreen> createState() => MapScreenState();
}

class MapScreenState extends State<MapScreen> {
  LatLng? currentLocation;
  MapController mapController = MapController();
  final _userRepository = UserRepository();
  final _fcmService = FcmService();
  List<AlertModel> _alerts = const [];
  bool _loadingAlerts = true;
  bool _isAuthority = false;

  /// Radio de `/reports/nearby` en km (usuarios no autoridad). Por defecto 5 km.
  double _radiusKm = 5.0;
  bool _radiusPanelOpen = false;

  @override
  void initState() {
    super.initState();
    // Detectar rol antes de cargar
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final user = context.read<AuthViewModel>().user;
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

  @override
  void didUpdateWidget(MapScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.initialAlert?.id != oldWidget.initialAlert?.id &&
        widget.initialAlert != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        final a = widget.initialAlert!;
        _showAlertBottomSheet(a);
        final c = a.coordinates;
        if (c.length >= 2) {
          mapController.move(LatLng(c[1], c[0]), 18);
        }
      });
    }
  }

  /// Recarga ubicación y reportes (p. ej. al volver a la pestaña Mapa).
  Future<void> reload() async {
    if (!mounted) return;
    final user = context.read<AuthViewModel>().user;
    setState(() {
      _isAuthority = (user?.roleId == 2) ||
          (user?.roleName?.toLowerCase().contains('autoridad') == true);
    });
    await getLocation();
  }

  Future<void> _initPushNotifications() async {
    final user = context.read<AuthViewModel>().user;
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
      final user = context.read<AuthViewModel>().user;
      if (user != null) {
        await _userRepository.updateLocation(
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
      final alertVM = context.read<AlertViewModel>();
      if (_isAuthority) {
        // Autoridades ven TODOS los reportes de la ciudad
        await alertVM.fetchAlerts();
      } else {
        // Usuarios normales ven reportes cercanos (5km de radio)
        if (currentLocation == null) {
          setState(() => _loadingAlerts = false);
          return;
        }
        final radiusM = (_radiusKm * 1000).round().clamp(200, 50000);
        await alertVM.fetchNearbyAlerts(
          latitude: currentLocation!.latitude,
          longitude: currentLocation!.longitude,
          radius: radiusM,
        );
      }
      if (!mounted) return;
      setState(() => _alerts = alertVM.alerts);
    } catch (e) {
      debugPrint('Error al cargar alertas: $e');
      // Fallback: intentar cargar todos
      try {
        final alertVM = context.read<AlertViewModel>();
        await alertVM.fetchAlerts();
        if (!mounted) return;
        setState(() => _alerts = alertVM.alerts);
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
                    if (!_isAuthority && currentLocation != null)
                      CircleLayer(
                        circles: [
                          CircleMarker(
                            point: currentLocation!,
                            radius: (_radiusKm * 1000),
                            useRadiusInMeter: true,
                            color: const Color(0xFF3B82F6).withValues(alpha: 0.14),
                            borderStrokeWidth: 2,
                            borderColor: const Color(0xFF3B82F6).withValues(alpha: 0.55),
                          ),
                        ],
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
                    color: const Color(0xFF1E293B).withValues(alpha: 0.92),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFF3B82F6).withValues(alpha: 0.5)),
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

          // Radio nearby: botón compacto que despliega el ajuste (solo ciudadanos)
          if (!_isAuthority && currentLocation != null)
            Positioned(
              top: MediaQuery.paddingOf(context).top + 8,
              left: 12,
              right: 12,
              child: Material(
                color: Colors.transparent,
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    color: const Color(0xFF1E293B).withValues(alpha: 0.96),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: _radiusPanelOpen
                          ? const Color(0xFF3B82F6).withValues(alpha: 0.35)
                          : Colors.white.withValues(alpha: 0.08),
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.35),
                        blurRadius: 14,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(20),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        InkWell(
                          onTap: () =>
                              setState(() => _radiusPanelOpen = !_radiusPanelOpen),
                          child: Padding(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 14, vertical: 12),
                            child: Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF3B82F6)
                                        .withValues(alpha: 0.18),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: const Icon(
                                    Icons.radar_rounded,
                                    color: Color(0xFF3B82F6),
                                    size: 20,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'Reportes a tu alrededor',
                                        style: TextStyle(
                                          color: Colors.white
                                              .withValues(alpha: 0.45),
                                          fontSize: 11,
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                      const SizedBox(height: 2),
                                      Row(
                                        children: [
                                          Text(
                                            _radiusKm % 1 == 0
                                                ? '${_radiusKm.toStringAsFixed(0)} km'
                                                : '${_radiusKm.toStringAsFixed(1)} km',
                                            style: const TextStyle(
                                              color: Colors.white,
                                              fontSize: 17,
                                              fontWeight: FontWeight.w800,
                                              letterSpacing: -0.3,
                                            ),
                                          ),
                                          const SizedBox(width: 8),
                                          Container(
                                            padding: const EdgeInsets.symmetric(
                                                horizontal: 8, vertical: 3),
                                            decoration: BoxDecoration(
                                              color: const Color(0xFF3B82F6)
                                                  .withValues(alpha: 0.22),
                                              borderRadius:
                                                  BorderRadius.circular(8),
                                            ),
                                            child: _loadingAlerts
                                                ? const SizedBox(
                                                    width: 14,
                                                    height: 14,
                                                    child:
                                                        CircularProgressIndicator(
                                                      strokeWidth: 2,
                                                      color: Color(0xFF93C5FD),
                                                    ),
                                                  )
                                                : Text(
                                                    '${_alerts.length}',
                                                    style: const TextStyle(
                                                      color: Color(0xFFBFDBFE),
                                                      fontSize: 12,
                                                      fontWeight: FontWeight.w800,
                                                    ),
                                                  ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                                AnimatedRotation(
                                  turns: _radiusPanelOpen ? 0.5 : 0,
                                  duration: const Duration(milliseconds: 220),
                                  curve: Curves.easeOutCubic,
                                  child: Icon(
                                    Icons.keyboard_arrow_down_rounded,
                                    color: Colors.white.withValues(alpha: 0.55),
                                    size: 28,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        AnimatedSize(
                          duration: const Duration(milliseconds: 240),
                          curve: Curves.easeOutCubic,
                          alignment: Alignment.topCenter,
                          child: _radiusPanelOpen
                              ? Column(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Divider(
                                      height: 1,
                                      thickness: 1,
                                      color: Colors.white.withValues(alpha: 0.08),
                                    ),
                                    Padding(
                                      padding: const EdgeInsets.fromLTRB(
                                          14, 10, 14, 14),
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            'El círculo en el mapa coincide con el radio enviado al servidor.',
                                            style: TextStyle(
                                              color: Colors.white
                                                  .withValues(alpha: 0.42),
                                              fontSize: 11,
                                              height: 1.35,
                                            ),
                                          ),
                                          const SizedBox(height: 6),
                                          SliderTheme(
                                            data: SliderTheme.of(context)
                                                .copyWith(
                                              activeTrackColor:
                                                  const Color(0xFF3B82F6),
                                              inactiveTrackColor: Colors.white
                                                  .withValues(alpha: 0.12),
                                              thumbColor:
                                                  const Color(0xFF60A5FA),
                                              overlayColor: const Color(0xFF3B82F6)
                                                  .withValues(alpha: 0.18),
                                              trackHeight: 3,
                                              valueIndicatorColor:
                                                  const Color(0xFF3B82F6),
                                            ),
                                            child: Slider(
                                              value: _radiusKm.clamp(0.5, 20.0),
                                              min: 0.5,
                                              max: 20,
                                              divisions: 39,
                                              label: _radiusKm % 1 == 0
                                                  ? '${_radiusKm.toStringAsFixed(0)} km'
                                                  : '${_radiusKm.toStringAsFixed(1)} km',
                                              onChanged: (v) =>
                                                  setState(() => _radiusKm = v),
                                              onChangeEnd: (_) => _loadAlerts(),
                                            ),
                                          ),
                                          Row(
                                            mainAxisAlignment:
                                                MainAxisAlignment.spaceBetween,
                                            children: [
                                              Text(
                                                '0.5 km',
                                                style: TextStyle(
                                                  color: Colors.white
                                                      .withValues(alpha: 0.35),
                                                  fontSize: 10,
                                                ),
                                              ),
                                              Text(
                                                '20 km',
                                                style: TextStyle(
                                                  color: Colors.white
                                                      .withValues(alpha: 0.35),
                                                  fontSize: 10,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                )
                              : const SizedBox(width: double.infinity),
                        ),
                      ],
                    ),
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



