import 'package:app_alertas/core/constants/api_constants.dart';
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
import 'package:app_alertas/services/tracking_service.dart';
import 'dart:async';

/// Raster tiles
String _mapboxDarkTileUrl() =>
    'https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/256/{z}/{x}/{y}'
    '?access_token=${ApiConstants.mapboxToken}';

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

  // Tracking
  final _trackingService = TrackingService();
  StreamSubscription? _trackingSub;
  List<Map<String, dynamic>> _activeVehicles = [];
  String? _selectedVehicleId;

  // Variables para la ubicación personalizada
  LatLng? customLocation;
  bool isCustomLocationActive = false;
  bool isEditingCustomLocation = false;

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

    _trackingSub = _trackingService.streamTrackings().listen((vehicles) {
      if (mounted) {
        setState(() {
          _activeVehicles = vehicles;
          // Si el vehículo seleccionado ya no existe, borrar la selección
          if (_selectedVehicleId != null && !vehicles.any((v) => v['id'] == _selectedVehicleId)) {
            _selectedVehicleId = null;
          }
        });
      }
    });
  }

  @override
  void dispose() {
    _trackingSub?.cancel();
    super.dispose();
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

  void _centerOnUser() {
    final target = isCustomLocationActive ? customLocation : currentLocation;
    if (target != null) {
      mapController.move(target, 16);
    } else {
      getLocation().then((_) {
        final newTarget = isCustomLocationActive ? customLocation : currentLocation;
        if (newTarget != null && mounted) {
          mapController.move(newTarget, 16);
        }
      });
    }
  }

  Future<void> _refreshRealLocation() async {
    setState(() {
      isCustomLocationActive = false;
      isEditingCustomLocation = false;
      customLocation = null;
    });
    await _loadAlerts();
    if (currentLocation != null) {
      mapController.move(currentLocation!, 13);
    }
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
        // Usuarios normales ven reportes cercanos
        final fetchLocation = isCustomLocationActive ? customLocation : currentLocation;
        if (fetchLocation == null) {
          setState(() => _loadingAlerts = false);
          return;
        }
        final radiusM = (_radiusKm * 1000).round().clamp(200, 50000);
        await alertVM.fetchNearbyAlerts(
          latitude: fetchLocation.latitude,
          longitude: fetchLocation.longitude,
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
                      color: const Color(0xFF0D1015),
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
      backgroundColor: const Color(0xFF0D1015), // Premium extremely deep dark slate
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      showDragHandle: true,
      isScrollControlled: true,
      builder: (context) {
        return SingleChildScrollView(
          child: SafeArea(
            child: AlertCard(
              alert: alert,
              isInBottomSheet: true,
            ),
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

  IconData _vehicleIconByType(String type) {
    final t = type.toLowerCase();
    if (t.contains('ambulancia') || t.contains('medic') || t.contains('salud')) {
      return Icons.local_hospital_rounded;
    }
    if (t.contains('bombero') || t.contains('incendio')) {
      return Icons.local_fire_department_rounded;
    }
    return Icons.directions_car_rounded;
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
                    onTap: (tapPosition, point) {
                      setState(() {
                        _selectedVehicleId = null; // Ocultar ruta de movilidad
                      });
                      if (isEditingCustomLocation) {
                        setState(() {
                          customLocation = point;
                        });
                        mapController.move(point, mapController.camera.zoom);
                      }
                    },
                  ),
                  children: [
                    TileLayer(
                      urlTemplate: _mapboxDarkTileUrl(),
                      userAgentPackageName: 'com.tuempresa.appalertas',
                      maxNativeZoom: 22,
                      maxZoom: 22,
                    ),
                    if (!_isAuthority && (isCustomLocationActive ? customLocation != null : currentLocation != null))
                      CircleLayer(
                        circles: [
                          CircleMarker(
                            point: isCustomLocationActive ? customLocation! : currentLocation!,
                            radius: (_radiusKm * 1000),
                            useRadiusInMeter: true,
                            color: const Color(0xFF3B82F6).withValues(alpha: 0.14),
                            borderStrokeWidth: 2,
                            borderColor: const Color(0xFF3B82F6).withValues(alpha: 0.55),
                          ),
                        ],
                      ),
                    
                    // Polyline de la ruta del vehículo seleccionado
                    if (_selectedVehicleId != null)
                      ...() {
                        final selectedVehicle = _activeVehicles.where((v) => v['id'] == _selectedVehicleId).firstOrNull;
                        if (selectedVehicle != null && selectedVehicle['route'] != null) {
                          final routeData = selectedVehicle['route'] as List;
                          final points = routeData.map((p) => LatLng(p['lat'] as double, p['lng'] as double)).toList();
                          return [
                            PolylineLayer(
                              polylines: [
                                Polyline(
                                  points: points,
                                  strokeWidth: 6,
                                  color: Colors.blueAccent,
                                  strokeCap: StrokeCap.round,
                                  strokeJoin: StrokeJoin.round,
                                ),
                              ],
                            )
                          ];
                        }
                        return [];
                      }(),

                    MarkerLayer(
                      markers: [
                        ..._buildAlertMarkers(),
                        
                        // Marcadores de Vehículos en movimiento
                        ..._activeVehicles.map((vehicle) {
                          final lat = vehicle['latitude'] as double;
                          final lng = vehicle['longitude'] as double;
                          final type = vehicle['type'] as String? ?? 'Desconocido';
                          final isSelected = vehicle['id'] == _selectedVehicleId;
                          
                          return Marker(
                            point: LatLng(lat, lng),
                            width: 50,
                            height: 50,
                            child: GestureDetector(
                              onTap: () {
                                setState(() {
                                  _selectedVehicleId = vehicle['id'] as String;
                                });
                              },
                              child: Container(
                                decoration: BoxDecoration(
                                  color: isSelected ? Colors.green : const Color(0xFF3B82F6),
                                  shape: BoxShape.circle,
                                  boxShadow: [
                                    BoxShadow(
                                      color: (isSelected ? Colors.green : const Color(0xFF3B82F6)).withValues(alpha: 0.55),
                                      blurRadius: 10,
                                      spreadRadius: 2,
                                    ),
                                  ],
                                  border: Border.all(color: Colors.white, width: 2),
                                ),
                                child: Icon(
                                  _vehicleIconByType(type),
                                  color: Colors.white,
                                  size: 22,
                                ),
                              ),
                            ),
                          );
                        }),
                        if (currentLocation != null)
                          Marker(
                            point: currentLocation!,
                            width: 40,
                            height: 40,
                            child: Icon(
                              Icons.my_location,
                              color: isCustomLocationActive ? Colors.grey : Colors.blue,
                              size: 28,
                            ),
                          ),
                        if (customLocation != null && (isCustomLocationActive || isEditingCustomLocation))
                          Marker(
                            point: customLocation!,
                            width: 40,
                            height: 40,
                            child: const Icon(
                              Icons.my_location,
                              color: Colors.blue,
                              size: 30,
                            ),
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
                    color: const Color(0xFF26292E).withValues(alpha: 0.92),
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
                    color: const Color(0xFF26292E).withValues(alpha: 0.96),
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
                                          const SizedBox(height: 16),
                                          Divider(
                                            height: 1,
                                            thickness: 1,
                                            color: Colors.white.withValues(alpha: 0.08),
                                          ),
                                          const SizedBox(height: 12),
                                          Row(
                                            children: [
                                              const Icon(
                                                Icons.my_location,
                                                color: Color(0xFF3B82F6),
                                                size: 16,
                                              ),
                                              const SizedBox(width: 8),
                                              const Text(
                                                'Ubicación Personalizada',
                                                style: TextStyle(
                                                  color: Colors.white,
                                                  fontSize: 12,
                                                  fontWeight: FontWeight.bold,
                                                ),
                                              ),
                                              const Spacer(),
                                              if (isCustomLocationActive)
                                                GestureDetector(
                                                  onTap: () {
                                                    setState(() {
                                                      isCustomLocationActive = false;
                                                      customLocation = null;
                                                    });
                                                    _loadAlerts();
                                                  },
                                                  child: Text(
                                                    'RESTABLECER',
                                                    style: TextStyle(
                                                      color: Colors.redAccent.shade100,
                                                      fontSize: 10,
                                                      fontWeight: FontWeight.bold,
                                                      letterSpacing: 0.5,
                                                    ),
                                                  ),
                                                ),
                                            ],
                                          ),
                                          const SizedBox(height: 8),
                                          if (isEditingCustomLocation) ...[
                                            Text(
                                              'Toque en cualquier parte del mapa',
                                              style: TextStyle(
                                                color: Colors.white.withValues(alpha: 0.5),
                                                fontSize: 11,
                                                height: 1.35,
                                              ),
                                            ),
                                            const SizedBox(height: 12),
                                            Row(
                                              children: [
                                                Expanded(
                                                  child: ElevatedButton(
                                                    style: ElevatedButton.styleFrom(
                                                      backgroundColor: Colors.transparent,
                                                      foregroundColor: Colors.white,
                                                      elevation: 0,
                                                      side: BorderSide(color: Colors.white.withValues(alpha: 0.2)),
                                                      padding: const EdgeInsets.symmetric(vertical: 8),
                                                      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.zero),
                                                    ),
                                                    onPressed: () {
                                                      setState(() {
                                                        isEditingCustomLocation = false;
                                                        if (!isCustomLocationActive) {
                                                          customLocation = null;
                                                        }
                                                      });
                                                    },
                                                    child: const Text('CANCELAR', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                                                  ),
                                                ),
                                                const SizedBox(width: 8),
                                                Expanded(
                                                  child: ElevatedButton(
                                                    style: ElevatedButton.styleFrom(
                                                      backgroundColor: const Color(0xFF3B82F6),
                                                      foregroundColor: Colors.black,
                                                      elevation: 0,
                                                      padding: const EdgeInsets.symmetric(vertical: 8),
                                                      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.zero),
                                                    ),
                                                    onPressed: customLocation == null ? null : () {
                                                      setState(() {
                                                        isEditingCustomLocation = false;
                                                        isCustomLocationActive = true;
                                                      });
                                                      _loadAlerts();
                                                    },
                                                    child: const Text('CONFIRMAR', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ] else ...[
                                            Text(
                                              isCustomLocationActive
                                                  ? 'Ubicación virtual activa. Todos los reportes cercanos se calcularán desde este punto.'
                                                  : 'Establece un punto virtual para explorar incidentes fuera de tu posición física.',
                                              style: TextStyle(
                                                color: Colors.white.withValues(alpha: 0.42),
                                                fontSize: 11,
                                                height: 1.35,
                                              ),
                                            ),
                                            const SizedBox(height: 10),
                                            SizedBox(
                                              width: double.infinity,
                                              child: ElevatedButton.icon(
                                                style: ElevatedButton.styleFrom(
                                                  backgroundColor: isCustomLocationActive
                                                      ? const Color(0xFF3B82F6).withValues(alpha: 0.1)
                                                      : Colors.white.withValues(alpha: 0.05),
                                                  foregroundColor: isCustomLocationActive ? const Color(0xFF3B82F6) : Colors.white,
                                                  elevation: 0,
                                                  side: BorderSide(
                                                    color: isCustomLocationActive
                                                        ? const Color(0xFF3B82F6).withValues(alpha: 0.3)
                                                        : Colors.white.withValues(alpha: 0.1),
                                                  ),
                                                  padding: const EdgeInsets.symmetric(vertical: 10),
                                                  shape: const RoundedRectangleBorder(borderRadius: BorderRadius.zero),
                                                ),
                                                onPressed: () {
                                                  setState(() {
                                                    isEditingCustomLocation = true;
                                                    customLocation ??= mapController.camera.center;
                                                  });
                                                },
                                                icon: Icon(
                                                  isCustomLocationActive
                                                      ? Icons.edit_location_alt_rounded
                                                      : Icons.add_location_alt_rounded,
                                                  size: 16,
                                                ),
                                                label: Text(
                                                  isCustomLocationActive
                                                      ? 'MODIFICAR UBICACIÓN PERSONALIZADA'
                                                      : 'ESTABLECER UBICACIÓN PERSONALIZADA',
                                                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                                                ),
                                              ),
                                            ),
                                          ]
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
      floatingActionButton: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          FloatingActionButton(
            heroTag: 'center_location_btn',
            backgroundColor: const Color(0xFF26292E),
            foregroundColor: const Color(0xFF3B82F6),
            onPressed: _centerOnUser,
            child: const Icon(Icons.my_location_rounded),
          ),
          const SizedBox(height: 12),
          FloatingActionButton(
            heroTag: 'refresh_alerts_btn',
            backgroundColor: const Color(0xFF26292E),
            foregroundColor: Colors.white,
            onPressed: _refreshRealLocation,
            child: _loadingAlerts
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white,
                    ),
                  )
                : const Icon(Icons.refresh_rounded),
          ),
        ],
      ),
    );
  }
}



