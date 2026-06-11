import 'package:app_alertas/core/config/mapbox_config.dart';
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

class MapScreen extends StatefulWidget {
  final AlertModel? initialAlert;
  const MapScreen({super.key, this.initialAlert});

  @override
  State<MapScreen> createState() => MapScreenState();
}

class MapScreenState extends State<MapScreen> with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;

  LatLng? currentLocation;
  MapController mapController = MapController();
  final _userRepository = UserRepository();
  final _fcmService = FcmService();
  List<AlertModel> _alerts = const [];
  bool _loadingLocation = true;
  bool _locationFromGps = false;
  bool _isAuthority = false;

  // Tracking
  final _trackingService = TrackingService();
  StreamSubscription? _trackingSub;
  List<Map<String, dynamic>> _activeVehicles = [];
  String? _selectedVehicleId;



  @override
  void initState() {
    super.initState();
    // Detectar rol antes de cargar
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final user = context.read<AuthViewModel>().user;
      _isAuthority = _userIsAuthority(user?.roleId, user?.roleName);
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
          if (_selectedVehicleId != null &&
              !vehicles.any((v) => v['id'] == _selectedVehicleId)) {
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
      _isAuthority = _userIsAuthority(user?.roleId, user?.roleName);
    });
    await _loadAlerts();
  }

  Future<void> _initPushNotifications() async {
    final user = context.read<AuthViewModel>().user;
    if (user != null) {
      _isAuthority = _userIsAuthority(user.roleId, user.roleName);
      await _fcmService.init(user.id);
      _fcmService.listenToForegroundMessages(() {
        _loadAlerts();
      });
    }
  }

  bool _userIsAuthority(int? roleId, String? roleName) {
    final name = roleName?.toLowerCase() ?? '';
    return roleId == 2 ||
        roleId == 3 ||
        name.contains('autoridad') ||
        name.contains('admin');
  }

  Future getLocation() async {
    if (!mounted) return;
    setState(() => _loadingLocation = true);

    LatLng center = currentLocation ?? MapboxConfig.defaultCenter;
    var fromGps = false;

    try {
      final serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (serviceEnabled) {
        var permission = await Geolocator.checkPermission();
        if (permission == LocationPermission.denied) {
          permission = await Geolocator.requestPermission();
        }
        if (permission == LocationPermission.whileInUse ||
            permission == LocationPermission.always) {
          final position = await Geolocator.getCurrentPosition(
            desiredAccuracy: LocationAccuracy.medium,
            timeLimit: const Duration(seconds: 12),
          );
          center = LatLng(position.latitude, position.longitude);
          fromGps = true;

          if (mounted) {
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
          }
        }
      }
    } catch (e) {
      debugPrint('GPS no disponible, usando centro por defecto: $e');
    }

    if (!mounted) return;
    setState(() {
      currentLocation = center;
      _locationFromGps = fromGps;
      _loadingLocation = false;
    });

    await _loadAlerts();
  }

  void _centerOnUser() {
    if (currentLocation != null) {
      mapController.move(currentLocation!, 16);
    } else {
      getLocation().then((_) {
        if (currentLocation != null && mounted) {
          mapController.move(currentLocation!, 16);
        }
      });
    }
  }

  Future<void> _loadAlerts() async {
    if (!mounted) return;
    
    try {
      final alertVM = context.read<AlertViewModel>();
      await alertVM.fetchAlerts();
      
      if (!mounted) return;
      setState(() => _alerts = alertVM.alerts);
    } catch (e) {
      debugPrint('Error al cargar alertas: $e');
    } finally {
    }
  }

  List<Marker> _buildAlertMarkers() {
    return _alerts
        .where((a) => a.coordinates.length >= 2)
        .map((alert) {
          final point = _toLatLng(alert.coordinates);
          if (point == null) return null;

          Color color = alert.verified
              ? Colors.green
              : _colorByType(alert.type);

          return Marker(
            point: point,
            width: 48,
            height: 48,
            alignment: Alignment.topCenter, // The point of the pin is at the bottom
            child: GestureDetector(
              onTap: () => _showAlertBottomSheet(alert),
              child: Stack(
                alignment: Alignment.center,
                children: [
                  Icon(Icons.location_on, color: color, size: 48),
                  Positioned(
                    top: 8,
                    child: Icon(_iconByType(alert.type), color: Colors.white, size: 20),
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
      backgroundColor: const Color(
        0xFF262624,
      ), // Premium extremely deep dark slate
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      showDragHandle: true,
      isScrollControlled: true,
      builder: (context) {
        return SingleChildScrollView(
          child: SafeArea(
            child: AlertCard(alert: alert, isInBottomSheet: true),
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
    if (t.contains('robo')) return Icons.local_police_rounded;
    if (t.contains('hurto')) return Icons.directions_run_rounded;
    if (t.contains('incendio')) return Icons.local_fire_department_rounded;
    if (t.contains('accidente')) return Icons.car_crash_rounded;
    if (t.contains('vial') || t.contains('obstrucción')) {
      return Icons.construction_rounded;
    }
    if (t.contains('médica') || t.contains('salud')) {
      return Icons.medical_services_rounded;
    }
    return Icons.warning_amber_rounded;
  }

  IconData _vehicleIconByType(String type) {
    final t = type.toLowerCase();
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

  Color _colorByType(String type) {
    final t = type.toLowerCase();
    if (t.contains('robo') || t.contains('hurto')) {
      return const Color(0xFFB64D4C);
    }
    if (t.contains('incendio')) return const Color(0xFFAA5F3C);
    if (t.contains('accidente') || t.contains('vial')) {
      return const Color(0xFF506E96);
    }
    if (t.contains('médica') || t.contains('salud')) {
      return const Color(0xFF3C8C6E);
    }
    return const Color(0xFFAF6D58);
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    return Scaffold(
      body: Stack(
        children: [
          _loadingLocation && currentLocation == null
              ? const Center(child: CircularProgressIndicator())
              : FlutterMap(
                  mapController: mapController,
                  options: MapOptions(
                    initialCenter:
                        widget.initialAlert != null &&
                                widget.initialAlert!.coordinates.length >= 2
                            ? LatLng(
                                widget.initialAlert!.coordinates[1],
                                widget.initialAlert!.coordinates[0],
                              )
                            : (currentLocation ?? MapboxConfig.defaultCenter),
                    initialZoom: widget.initialAlert != null ? 18 : 16,
                    maxZoom: 22,
                    onMapReady: () {
                      _loadAlerts();
                    },
                    onTap: (tapPosition, point) {
                      setState(() {
                        _selectedVehicleId = null;
                      });
                    },
                  ),
                  children: [
                    MapboxConfig.darkTileLayer(),
                    if (_selectedVehicleId != null)
                      ...() {
                        final selectedVehicle = _activeVehicles
                            .where((v) => v['id'] == _selectedVehicleId)
                            .firstOrNull;
                        if (selectedVehicle != null &&
                            selectedVehicle['route'] != null) {
                          final routeData = selectedVehicle['route'] as List;
                          final points = routeData
                              .map(
                                (p) => LatLng(
                                  p['lat'] as double,
                                  p['lng'] as double,
                                ),
                              )
                              .toList();
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
                            ),
                          ];
                        }
                        return [];
                      }(),

                    MarkerLayer(
                      markers: [
                        ..._buildAlertMarkers(),
                        ..._activeVehicles.map((vehicle) {
                          final lat = vehicle['latitude'] as double;
                          final lng = vehicle['longitude'] as double;
                          final type =
                              vehicle['type'] as String? ?? 'Desconocido';
                          final isSelected =
                              vehicle['id'] == _selectedVehicleId;

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
                                  color: isSelected
                                      ? Colors.green
                                      : const Color(0xFF3B82F6),
                                  shape: BoxShape.circle,
                                  boxShadow: [
                                    BoxShadow(
                                      color:
                                          (isSelected
                                                  ? Colors.green
                                                  : const Color(0xFF3B82F6))
                                              .withValues(alpha: 0.55),
                                      blurRadius: 10,
                                      spreadRadius: 2,
                                    ),
                                  ],
                                  border: Border.all(
                                    color: Colors.white,
                                    width: 2,
                                  ),
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
                            width: 30,
                            height: 30,
                            child: Container(
                              decoration: BoxDecoration(
                                color: const Color(0xFFAF6D58),
                                shape: BoxShape.circle,
                                border: Border.all(color: Colors.white, width: 2),
                              ),
                              child: const Icon(
                                Icons.my_location_rounded,
                                color: Colors.white,
                                size: 14,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ],
                ),

          if (!_locationFromGps && currentLocation != null)
            Positioned(
              top: MediaQuery.paddingOf(context).top + (_isAuthority ? 48 : 8),
              left: 12,
              right: 12,
              child: Center(
                child: Material(
                  color: Colors.black54,
                  borderRadius: BorderRadius.circular(12),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 8,
                    ),
                    child: Text(
                      'Sin GPS: mapa centrado en Santa Cruz. Activa ubicación para ver tu zona.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.9),
                        fontSize: 11,
                      ),
                    ),
                  ),
                ),
              ),
            ),

          if (_isAuthority)
            Positioned(
              top: 12,
              left: 0,
              right: 0,
              child: Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFF30302E).withValues(alpha: 0.92),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: const Color(0xFFAF6D58).withValues(alpha: 0.5),
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(
                        Icons.shield_rounded,
                        color: Color(0xFFAF6D58),
                        size: 15,
                      ),
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
      floatingActionButton: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          FloatingActionButton(
            heroTag: 'center_location_btn',
            backgroundColor: const Color(0xFF30302E),
            foregroundColor: const Color(0xFFAF6D58),
            onPressed: _centerOnUser,
            child: const Icon(Icons.my_location_rounded),
          ),
          const SizedBox(height: 12),
          FloatingActionButton(
            heroTag: 'refresh_alerts_btn',
            backgroundColor: const Color(0xFF30302E),
            foregroundColor: Colors.white,
            onPressed: () {
              _centerOnUser();
              _loadAlerts();
            },
            child: const Icon(Icons.refresh_rounded),
          ),
        ],
      ),
    );
  }
}
