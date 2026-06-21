import 'package:app_alertas/core/report_visibility.dart';
import 'package:app_alertas/core/config/mapbox_config.dart';
import 'package:app_alertas/core/utils/role_utils.dart';
import 'dart:io';
import 'package:image_picker/image_picker.dart';
import 'package:app_alertas/core/utils/error_handler.dart';
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
import 'package:app_alertas/viewmodels/tracking_provider.dart';
import 'package:app_alertas/core/risk_zones.dart';
import 'package:app_alertas/viewmodels/risk_zone_provider.dart';
import 'package:app_alertas/views/widgets/risk_zone_overlay.dart';
import 'package:app_alertas/views/alert_card.dart';
import 'package:app_alertas/services/tracking_service.dart';
import 'package:app_alertas/services/emergency_station_service.dart';
import 'package:app_alertas/services/route_corridor_monitor_service.dart';
import 'package:app_alertas/core/emergency_station_utils.dart';
import 'package:app_alertas/models/emergency_station_model.dart';
import 'dart:async';
import 'dart:math' as math;
import 'dart:ui' as ui;

class MapScreen extends StatefulWidget {
  final AlertModel? initialAlert;
  final bool shouldTraceRoute;
  const MapScreen({super.key, this.initialAlert, this.shouldTraceRoute = false});

  @override
  State<MapScreen> createState() => MapScreenState();
}

class MapScreenState extends State<MapScreen> with AutomaticKeepAliveClientMixin, TickerProviderStateMixin {
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
  bool _showEmergencyStations = true;
  List<EmergencyStationModel> _emergencyStations = const [];
  List<EmergencyStationModel> _nearestEmergencyStations = const [];
  final _emergencyStationService = EmergencyStationService();

  // Tracking
  final _trackingService = TrackingService();
  StreamSubscription? _trackingSub;

  // Reports Socket
  StreamSubscription<ServiceStatus>? _serviceStatusSub;
  List<Map<String, dynamic>> _activeVehicles = [];
  String? _selectedVehicleId;

  // Animación del vehículo (nuestra propia orientación)
  AnimationController? _vehicleAnimController;
  Animation<double>? _bearingAnimation;
  double _animatedBearing = 0.0;
  double _lastBearing = 0.0;
  bool _dialogShown = false;
  bool _isBottomSheetOpen = false;
  final LayerHitNotifier<AlertModel> _polylineHitNotifier = ValueNotifier(null);

  // Animación de pulso para vehículos de tracking
  AnimationController? _pulseController;
  Animation<double>? _userCenterPulseAnimation;

  void _onTrackingProviderUpdate() {
    if (!mounted) return;
    final trackingProvider = Provider.of<TrackingProvider>(context, listen: false);

    setState(() {});

    if (trackingProvider.incidentLatitude != null &&
        trackingProvider.incidentLongitude != null) {
      if (trackingProvider.routePoints.isNotEmpty &&
          !trackingProvider.isFollowingRoute) {
        _fitRouteInView();
      }
      if (trackingProvider.isFollowingRoute &&
          trackingProvider.currentLocation != null) {
        mapController.move(trackingProvider.currentLocation!, 17);
      }
      if (trackingProvider.bearing != _lastBearing) {
        _lastBearing = trackingProvider.bearing;
        _animateBearing(_lastBearing);
      }
      if (trackingProvider.hasArrived && !_dialogShown) {
        _dialogShown = true;
        _showArrivalDialog();
      }
    } else {
      _dialogShown = false;
    }
  }

  void _onAlertsChanged() {
    if (!mounted) return;
    final alertVM = context.read<AlertViewModel>();
    setState(() {
      _alerts = alertVM.alerts;
    });
    context.read<RiskZoneProvider>().updateFromAlerts(
      filterAlertsForMap(alertVM.alerts),
    );
  }

  void _animateBearing(double newBearing) {
    if (_vehicleAnimController == null) return;
    _bearingAnimation =
        Tween<double>(begin: _animatedBearing, end: newBearing).animate(
          CurvedAnimation(
            parent: _vehicleAnimController!,
            curve: Curves.easeOut,
          ),
        )..addListener(() {
          if (mounted) {
            setState(() => _animatedBearing = _bearingAnimation!.value);
          }
        });
    _vehicleAnimController!.forward(from: 0);
  }

  Future<void> _startPreTracking(AlertModel alert) async {
    final incidentLocation = _toLatLng(alert.coordinates);
    if (incidentLocation == null) {
      _showRouteMessage('Este incidente no tiene coordenadas válidas.');
      return;
    }
    await _startPreTrackingToDestination(
      lat: incidentLocation.latitude,
      lng: incidentLocation.longitude,
      type: alert.type,
      description: alert.description,
      reportId: alert.id,
      successMessage: 'Ruta guardada. Ya puedes ejecutar el script de simulación en la laptop.',
    );
  }

  Future<void> _startPreTrackingToDestination({
    required double lat,
    required double lng,
    required String type,
    required String description,
    int? reportId,
    String successMessage = 'Ruta trazada hacia el destino.',
  }) async {
    final trackingProvider = Provider.of<TrackingProvider>(context, listen: false);

    final user = context.read<AuthViewModel>().user;
    final userId = user?.id;
    final profileType = user?.authorityProfileType;
    if (userId == null || userId.isEmpty) {
      _showRouteMessage('Sesión inválida. Vuelve a iniciar sesión como autoridad.');
      return;
    }

    _dialogShown = false;
    final nearestStation = _nearestEmergencyStations.isNotEmpty ? _nearestEmergencyStations.first : null;
    final nearestStationId = nearestStation?.id;
    final nearestStationCoords = (nearestStation != null && nearestStation.coordinates.length >= 2)
        ? LatLng(nearestStation.coordinates[1], nearestStation.coordinates[0])
        : null;

    final success = await trackingProvider.preparePreTracking(
      lat: lat,
      lng: lng,
      type: type,
      description: description,
      userId: userId,
      reportId: reportId,
      nearestStationId: nearestStationId,
      nearestStationCoords: nearestStationCoords,
      profileType: profileType,
    );

    if (!mounted) return;

    if (!success) {
      _showRouteMessage(
        trackingProvider.locationError ??
            'No se pudo trazar la ruta. Activa el GPS e intenta de nuevo.',
      );
      return;
    }

    setState(() {});
    _fitRouteInView();
    _showRouteMessage(successMessage, successColor: true);
  }

  void _showRouteMessage(String message, {bool successColor = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: successColor ? const Color(0xFF6D8566) : Colors.orange,
        duration: const Duration(seconds: 4),
      ),
    );
  }

  void _fitRouteInView() {
    final trackingProvider = Provider.of<TrackingProvider>(context, listen: false);
    if (trackingProvider.currentLocation == null ||
        trackingProvider.incidentLatitude == null ||
        trackingProvider.incidentLongitude == null) {
      return;
    }
    WidgetsBinding.instance.addPostFrameCallback((_) {
      try {
        mapController.fitCamera(
          CameraFit.coordinates(
            coordinates: [
              trackingProvider.currentLocation!,
              LatLng(trackingProvider.incidentLatitude!, trackingProvider.incidentLongitude!),
            ],
            padding: const EdgeInsets.all(60),
          ),
        );
      } catch (e) {
        debugPrint('MapController no está listo aún: $e');
      }
    });
  }

  Future<void> _toggleRouteTrackingToDestination({
    required double lat,
    required double lng,
    required String type,
    required String description,
    int? reportId,
  }) async {
    final trackingProvider = Provider.of<TrackingProvider>(context, listen: false);
    final user = context.read<AuthViewModel>().user;
    final userId = user?.id ?? 'unknown';
    final profileType = user?.authorityProfileType;

    final isSameDestination = trackingProvider.isSameIncident(lat, lng);

    if (trackingProvider.isFollowingRoute && isSameDestination) {
      await trackingProvider.stopRouteTracking();
      _fitRouteInView();
    } else {
      if (trackingProvider.isFollowingRoute) {
        await trackingProvider.stopRouteTracking();
      }
      _dialogShown = false;
      final nearestStation = _nearestEmergencyStations.isNotEmpty ? _nearestEmergencyStations.first : null;
      final nearestStationId = nearestStation?.id;
      final nearestStationCoords = (nearestStation != null && nearestStation.coordinates.length >= 2)
          ? LatLng(nearestStation.coordinates[1], nearestStation.coordinates[0])
          : null;

      await trackingProvider.startRouteTracking(
        latitude: lat,
        longitude: lng,
        description: description,
        type: type,
        userId: userId,
        reportId: reportId,
        nearestStationId: nearestStationId,
        nearestStationCoords: nearestStationCoords,
        profileType: profileType,
      );
      if (trackingProvider.currentLocation != null) {
        mapController.move(trackingProvider.currentLocation!, 17);
      }
    }
  }

  Future<void> _cancelRouteAndTracking() async {
    final trackingProvider = Provider.of<TrackingProvider>(context, listen: false);
    await trackingProvider.stopRouteTracking();
    await trackingProvider.clearPreTracking();
  }

  Future<void> _handleContribute(AlertModel alert) async {
    // 1. Check if user location is available and GPS is active
    if (!_locationFromGps || currentLocation == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Ubicación no disponible. Por favor, activa el GPS para poder aportar.'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    // 2. Extract coordinates from alert
    if (alert.coordinates.length < 2) return;
    final alertLat = alert.coordinates[1];
    final alertLng = alert.coordinates[0];

    // 3. Calculate distance
    final distance = Geolocator.distanceBetween(
      currentLocation!.latitude,
      currentLocation!.longitude,
      alertLat,
      alertLng,
    );

    // 4. Validate 100 meters
    if (distance > 100.0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('No se encuentra dentro del área para apoyar el reporte.'),
          backgroundColor: Color(0xFFB64D4C),
          duration: Duration(seconds: 4),
        ),
      );
      return;
    }

    // 5. Open image selector bottom sheet
    final ImageSource? source = await showModalBottomSheet<ImageSource>(
      context: context,
      backgroundColor: const Color(0xFF262624),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.camera_alt, color: Colors.white),
              title: const Text('Cámara', style: TextStyle(color: Colors.white)),
              onTap: () => Navigator.pop(ctx, ImageSource.camera),
            ),
            ListTile(
              leading: const Icon(Icons.photo_library, color: Colors.white),
              title: const Text('Galería', style: TextStyle(color: Colors.white)),
              onTap: () => Navigator.pop(ctx, ImageSource.gallery),
            ),
          ],
        ),
      ),
    );

    if (source == null) return;

    final ImagePicker picker = ImagePicker();
    final pickedFile = await picker.pickImage(
      source: source,
      imageQuality: 85,
      maxWidth: 1280,
      maxHeight: 1280,
    );

    if (pickedFile == null) return;
    final File imageFile = File(pickedFile.path);

    // 6. Show loading dialog
    if (!mounted) return;
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const Center(child: CircularProgressIndicator()),
    );

    // 7. Call API via alertVM
    try {
      final userId = context.read<AuthViewModel>().user?.id ?? 'unknown';
      final alertVM = context.read<AlertViewModel>();
      await alertVM.attachImageToReport(
        reportId: alert.id,
        userId: userId,
        imageFile: imageFile,
      ).timeout(const Duration(seconds: 15));

      if (mounted) {
        Navigator.pop(context); // close loading dialog
        Navigator.pop(context); // close alert bottom sheet
        
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('¡Aporte subido con éxito!'),
            backgroundColor: Colors.green,
          ),
        );
        
        await _loadAlerts();
      }
    } catch (e) {
      if (mounted) {
        Navigator.pop(context); // close loading dialog
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error al subir el aporte: ${parseError(e)}'),
            backgroundColor: const Color(0xFFB64D4C),
          ),
        );
      }
    }
  }

  Future<void> _showArrivalDialog() async {
    if (!mounted) return;
    return showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return Dialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          backgroundColor: const Color(0xFF1A1E27),
          child: Padding(
            padding: const EdgeInsets.all(28),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 72,
                  height: 72,
                  decoration: BoxDecoration(
                    color: Colors.greenAccent.withValues(alpha: 0.15),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.check_circle_rounded,
                    color: Colors.greenAccent,
                    size: 44,
                  ),
                ),
                const SizedBox(height: 20),
                const Text(
                  '¡Ha llegado a su destino!',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.5,
                  ),
                ),
                const SizedBox(height: 10),
                const Text(
                  'Ha llegado al punto de la emergencia.\nNavegación finalizada.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Color(0xFF94A3B8),
                    fontSize: 14,
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 28),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.greenAccent,
                      foregroundColor: Colors.black,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    onPressed: () => Navigator.of(context).pop(),
                    child: const Text(
                      'CERRAR',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  void initState() {
    super.initState();

    _polylineHitNotifier.addListener(() {
      final hitResult = _polylineHitNotifier.value;
      if (hitResult != null && hitResult.hitValues.isNotEmpty) {
        final alert = hitResult.hitValues.first;
        _showAlertBottomSheet(alert);
      }
    });

    _vehicleAnimController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );
    _bearingAnimation = Tween<double>(begin: 0, end: 0).animate(
      CurvedAnimation(
        parent: _vehicleAnimController!,
        curve: Curves.easeOut,
      ),
    )..addListener(() {
      if (mounted) {
        setState(() => _animatedBearing = _bearingAnimation!.value);
      }
    });

    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    );
    _userCenterPulseAnimation = Tween<double>(begin: 14.0, end: 18.0).animate(
      CurvedAnimation(
        parent: _pulseController!,
        curve: Curves.easeInOut,
      ),
    );
    _pulseController!.repeat(reverse: true);

    WidgetsBinding.instance.addPostFrameCallback((_) {
      final user = context.read<AuthViewModel>().user;
      _isAuthority = _userIsAuthority(user?.roleId, user?.roleName);

      final trackingProvider = Provider.of<TrackingProvider>(context, listen: false);
      trackingProvider.addListener(_onTrackingProviderUpdate);

      final userId = user?.id;
      unawaited(RouteCorridorMonitorService.instance.start(userId));
      unawaited(_loadEmergencyStations());
    });

    _serviceStatusSub = Geolocator.getServiceStatusStream().listen((status) {
      if (status == ServiceStatus.enabled) {
        getLocation();
      } else {
        if (mounted) {
          setState(() {
            _locationFromGps = false;
          });
        }
      }
    });

    getLocation();
    _initPushNotifications();

    if (widget.initialAlert != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _showAlertBottomSheet(widget.initialAlert!);
        if (widget.shouldTraceRoute) {
          _startPreTracking(widget.initialAlert!);
        }
      });
    }

    _trackingSub = _trackingService.streamTrackings().listen((vehicles) {
      if (mounted) {
        final currentUserId = context.read<AuthViewModel>().user?.id;
        final otherVehicles = vehicles.where((v) => v['id'] != currentUserId).toList();
        setState(() {
          _activeVehicles = otherVehicles;
          if (_selectedVehicleId != null &&
              !otherVehicles.any((v) => v['id'] == _selectedVehicleId)) {
            _selectedVehicleId = null;
          }
        });
      }
    });

    context.read<AlertViewModel>().addListener(_onAlertsChanged);
  }

  @override
  void dispose() {
    _polylineHitNotifier.dispose();
    try {
      final trackingProvider = Provider.of<TrackingProvider>(context, listen: false);
      trackingProvider.removeListener(_onTrackingProviderUpdate);
    } catch (_) {}
    try {
      context.read<AlertViewModel>().removeListener(_onAlertsChanged);
    } catch (_) {}
    _serviceStatusSub?.cancel();
    _trackingSub?.cancel();
    unawaited(RouteCorridorMonitorService.instance.stop());
    _vehicleAnimController?.dispose();
    _pulseController?.dispose();
    super.dispose();
  }

  @override
  void didUpdateWidget(MapScreen oldWidget) {
    super.didUpdateWidget(oldWidget);

    final initialAlertChanged = widget.initialAlert?.id != oldWidget.initialAlert?.id;
    final traceRouteChanged = widget.shouldTraceRoute != oldWidget.shouldTraceRoute;

    if ((initialAlertChanged || traceRouteChanged) && widget.initialAlert != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        final a = widget.initialAlert!;
        _showAlertBottomSheet(a);
        final c = a.coordinates;
        if (c.length >= 2) {
          mapController.move(LatLng(c[1], c[0]), 18);
        }
        if (widget.shouldTraceRoute) {
          _startPreTracking(a);
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
    if (!_locationFromGps) {
      await getLocation();
    } else {
      await _loadAlerts();
    }
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

  bool _userIsAuthority(int? roleId, String? roleName) => isStaffRole(roleId, roleName);

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
    if (_isAuthority && _locationFromGps && currentLocation != null) {
      await _loadNearestEmergencyStations();
    }
  }

  Future<void> _loadEmergencyStations() async {
    try {
      final stations = await _emergencyStationService.findAll();
      if (!mounted) return;
      setState(() => _emergencyStations = stations);
    } catch (e) {
      debugPrint('Error cargando estaciones: $e');
    }
  }

  Future<void> _loadNearestEmergencyStations() async {
    if (!_isAuthority || currentLocation == null) return;
    try {
      final user = context.read<AuthViewModel>().user;
      final profileType = user?.authorityProfileType;

      final profileToTypes = {
        'policia': ['policia'],
        'bombero': ['bombero'],
        'paramedico': ['hospital'],
      };
      
      final allowedTypes = profileToTypes[profileType] ?? [];

      if (_emergencyStations.isEmpty) {
        final stations = await _emergencyStationService.findAll();
        if (!mounted) return;
        setState(() => _emergencyStations = stations);
      }

      var filteredStations = _emergencyStations;
      if (allowedTypes.isNotEmpty) {
        filteredStations = filteredStations.where((s) => allowedTypes.contains(s.installationType)).toList();
      }

      final stationsWithDistance = <Map<String, dynamic>>[];
      for (final station in filteredStations) {
        if (station.coordinates.length >= 2) {
          final distanceMeters = Geolocator.distanceBetween(
            currentLocation!.latitude,
            currentLocation!.longitude,
            station.coordinates[1],
            station.coordinates[0],
          );
          stationsWithDistance.add({
            'station': station,
            'distance': distanceMeters,
          });
        }
      }

      stationsWithDistance.sort((a, b) => (a['distance'] as double).compareTo(b['distance'] as double));

      final nearest = stationsWithDistance.take(6).map((item) {
        final s = item['station'] as EmergencyStationModel;
        final d = (item['distance'] as double).round();
        return EmergencyStationModel(
          id: s.id,
          name: s.name,
          installationType: s.installationType,
          coordinates: s.coordinates,
          distanceMeters: d,
        );
      }).toList();

      if (!mounted) return;
      setState(() => _nearestEmergencyStations = nearest);
    } catch (e) {
      debugPrint('Error cargando estaciones cercanas localmente: $e');
    }
  }

  void _centerOnUser() {
    if (_locationFromGps && currentLocation != null) {
      mapController.move(currentLocation!, 16);
    } else {
      getLocation().then((_) {
        if (_locationFromGps && currentLocation != null && mounted) {
          mapController.move(currentLocation!, 16);
        } else if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('No se pudo acceder a la ubicación. Verifica que el GPS esté activo y los permisos concedidos.'),
              backgroundColor: Colors.orange,
              duration: Duration(seconds: 4),
            ),
          );
        }
      });
    }
  }

  Future<void> _loadAlerts() async {
    if (!mounted) return;
    
    try {
      final alertVM = context.read<AlertViewModel>();
      final user = context.read<AuthViewModel>().user;
      await alertVM.fetchAlerts(
        includeDeleted: _userIsAuthority(user?.roleId, user?.roleName),
      );
      
      if (!mounted) return;
      setState(() => _alerts = alertVM.alerts);
      await context.read<RiskZoneProvider>().updateFromAlerts(
        filterAlertsForMap(alertVM.alerts),
      );
    } catch (e) {
      debugPrint('Error al cargar alertas: $e');
    } finally {
    }
  }

  List<CircleMarker<Object>> _buildRiskZoneCircles(List<RiskZone> zones) {
    final circles = <CircleMarker<Object>>[];
    for (final zone in zones) {
      void addRing(double factor, double alpha) {
        circles.add(
          CircleMarker(
            point: zone.center,
            radius: zone.radiusMeters * factor,
            useRadiusInMeter: true,
            color: zone.color.withValues(alpha: alpha + zone.riskIndex * 0.18),
            borderColor: zone.color.withValues(alpha: 0.5),
            borderStrokeWidth: 1,
          ),
        );
      }

      addRing(1.0, 0.1);
      addRing(0.62, 0.14);
      addRing(0.32, 0.2);
    }
    return circles;
  }

  List<Marker> _buildTrackingMarkers(BuildContext context) {
    final trackingProvider = Provider.of<TrackingProvider>(context);
    final markers = <Marker>[];

    for (final vehicle in _activeVehicles) {
      final lat = vehicle['latitude'] as double;
      final lng = vehicle['longitude'] as double;
      final isSelected = vehicle['id'] == _selectedVehicleId;
      final profileType = vehicle['profileType'] as String?;

      markers.add(
        Marker(
          point: LatLng(lat, lng),
          width: 48,
          height: 48,
          child: GestureDetector(
            onTap: () {
              setState(() {
                _selectedVehicleId = vehicle['id'] as String;
              });
            },
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: isSelected
                  ? BoxDecoration(
                      shape: BoxShape.circle,
                      color: Colors.green.withValues(alpha: 0.25),
                      border: Border.all(color: Colors.green, width: 2),
                    )
                  : null,
              child: Image.asset(
                _vehicleAssetByProfileType(profileType),
                width: 40,
                height: 40,
                fit: BoxFit.contain,
              ),
            ),
          ),
        ),
      );
    }

    final isTrackingActive = trackingProvider.incidentLatitude != null &&
        trackingProvider.incidentLongitude != null;
    final userLoc = isTrackingActive
        ? trackingProvider.currentLocation
        : currentLocation;
    if (userLoc == null) return markers;

    if (isTrackingActive) {
      markers.add(
        Marker(
          point: userLoc,
          width: 24,
          height: 24,
          child: Transform.rotate(
            angle: _animatedBearing * math.pi / 180,
            child: Container(
              width: 24,
              height: 24,
              decoration: const BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
              ),
              child: Center(
                child: AnimatedBuilder(
                  animation: _userCenterPulseAnimation!,
                  builder: (context, child) {
                    final size = _userCenterPulseAnimation!.value;
                    return Container(
                      width: size,
                      height: size,
                      decoration: const BoxDecoration(
                        color: Color(0xFFAF6D58),
                        shape: BoxShape.circle,
                      ),
                    );
                  },
                ),
              ),
            ),
          ),
        ),
      );
    } else {
      markers.add(
        Marker(
          point: userLoc,
          width: 24,
          height: 24,
          child: Container(
            width: 24,
            height: 24,
            decoration: const BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
            ),
            child: Center(
              child: AnimatedBuilder(
                animation: _userCenterPulseAnimation!,
                builder: (context, child) {
                  final size = _userCenterPulseAnimation!.value;
                  return Container(
                    width: size,
                    height: size,
                    decoration: const BoxDecoration(
                      color: Color(0xFFAF6D58),
                      shape: BoxShape.circle,
                    ),
                  );
                },
              ),
            ),
          ),
        ),
      );
    }

    return markers;
  }

  String _emergencyStationAsset(String type) {
    switch (type.toLowerCase()) {
      case 'policia':
        return 'assets/icon/policia.png';
      case 'bombero':
        return 'assets/icon/bombero.png';
      case 'hospital':
        return 'assets/icon/hospital.png';
      default:
        return 'assets/icon/policia.png';
    }
  }

  String _vehicleAssetByProfileType(String? profileType) {
    switch (profileType?.toLowerCase()) {
      case 'policia':
        return 'assets/icon/coche-de-policia.png';
      case 'bombero':
        return 'assets/icon/camion-de-bomberos.png';
      case 'paramedico':
        return 'assets/icon/ambulancia.png';
      default:
        return 'assets/icon/coche-de-policia.png';
    }
  }

  List<Marker> _buildEmergencyStationMarkers() {
    if (!_showEmergencyStations) return const [];

    return _emergencyStations
        .where((s) => s.coordinates.length >= 2 && s.coordinates[0] != 0 && s.coordinates[1] != 0)
        .map(
          (station) => Marker(
            point: LatLng(station.coordinates[1], station.coordinates[0]),
            width: 24,
            height: 24,
            child: GestureDetector(
              onTap: () => _showEmergencyStationBottomSheet(station),
              child: Image.asset(
                _emergencyStationAsset(station.installationType),
                width: 24,
                height: 24,
                fit: BoxFit.contain,
              ),
            ),
          ),
        )
        .toList();
  }

  Widget _buildRouteTrackingButton({
    required TrackingProvider trackingProvider,
    required double destLat,
    required double destLng,
    required String type,
    required String description,
    int? reportId,
  }) {
    final isSameDestination = trackingProvider.isSameIncident(destLat, destLng);
    final isRouteTraced =
        trackingProvider.routePoints.isNotEmpty && isSameDestination;
    final isFollowingRoute =
        trackingProvider.isFollowingRoute && isSameDestination;
    final hasArrived = trackingProvider.hasArrived && isSameDestination;
    final isLoadingRoute = trackingProvider.isLoadingRoute && isSameDestination;
    final isAnotherRouteActive =
        trackingProvider.isFollowingRoute && !isSameDestination;

    return SizedBox(
      width: double.infinity,
      child: ElevatedButton.icon(
        style: ElevatedButton.styleFrom(
          backgroundColor: isAnotherRouteActive
              ? Colors.grey.shade800
              : isFollowingRoute
                  ? const Color(0xFFAF3C32)
                  : const Color(0xFFAF6D58),
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(24),
          ),
          elevation: 0,
        ),
        onPressed: isAnotherRouteActive
            ? () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text(
                      'Ya hay una navegación activa hacia otro destino. Deténla primero.',
                    ),
                    backgroundColor: Colors.redAccent,
                  ),
                );
              }
            : (isLoadingRoute || hasArrived)
                ? null
                : () {
                    if (isRouteTraced || isFollowingRoute) {
                      _toggleRouteTrackingToDestination(
                        lat: destLat,
                        lng: destLng,
                        type: type,
                        description: description,
                        reportId: reportId,
                      );
                    } else {
                      _startPreTrackingToDestination(
                        lat: destLat,
                        lng: destLng,
                        type: type,
                        description: description,
                        reportId: reportId,
                        successMessage: 'Ruta trazada. Pulsa INICIAR NAVEGACIÓN para ir en vivo.',
                      );
                    }
                  },
        icon: isAnotherRouteActive
            ? const Icon(Icons.warning_amber_rounded, color: Colors.grey)
            : isLoadingRoute
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white,
                    ),
                  )
                : Icon(
                    isFollowingRoute
                        ? (hasArrived ? Icons.check_circle_rounded : Icons.stop_rounded)
                        : (isRouteTraced ? Icons.navigation_rounded : Icons.directions_rounded),
                  ),
        label: Text(
          isAnotherRouteActive
              ? 'OTRA RUTA EN CURSO'
              : isLoadingRoute
                  ? 'CARGANDO RUTA...'
                  : isFollowingRoute
                      ? (hasArrived ? 'LLEGÓ AL DESTINO' : 'DETENER RUTA')
                      : (isRouteTraced ? 'INICIAR NAVEGACIÓN' : 'TRAZAR RUTA'),
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
      ),
    );
  }

  void _showEmergencyStationBottomSheet(EmergencyStationModel station) {
    if (_isBottomSheetOpen) {
      Navigator.of(context).pop();
    }
    _isBottomSheetOpen = true;

    mapController.move(LatLng(station.coordinates[1], station.coordinates[0]), 16);

    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF262624),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      showDragHandle: true,
      isScrollControlled: true,
      builder: (context) {
        return Consumer<TrackingProvider>(
          builder: (context, trackingProvider, _) {
            final distanceKm = (station.distanceMeters ?? 0) / 1000;

            return SingleChildScrollView(
              child: SafeArea(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            width: 48,
                            height: 48,
                            decoration: BoxDecoration(
                              color: emergencyStationTypeColor(station.installationType)
                                  .withValues(alpha: 0.2),
                              shape: BoxShape.circle,
                            ),
                            child: Icon(
                              emergencyStationTypeIcon(station.installationType),
                              color: emergencyStationTypeColor(station.installationType),
                              size: 26,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  station.name,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 18,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  emergencyStationTypeLabel(station.installationType),
                                  style: TextStyle(
                                    color: emergencyStationTypeColor(station.installationType),
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                if (station.distanceMeters != null)
                                  Padding(
                                    padding: const EdgeInsets.only(top: 6),
                                    child: Text(
                                      'A ${distanceKm.toStringAsFixed(1)} km de tu ubicación',
                                      style: const TextStyle(
                                        color: Colors.white54,
                                        fontSize: 11,
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        );
      },
    ).then((_) {
      _isBottomSheetOpen = false;
      if (!mounted) return;
      final trackingProvider = Provider.of<TrackingProvider>(context, listen: false);
      if (!trackingProvider.isFollowingRoute) {
        _cancelRouteAndTracking();
      }
    });
  }

  List<Marker> _buildAlertMarkers() {
    return filterAlertsForMap(_alerts)
        .where((a) => a.coordinates.length >= 2)
        .map((alert) {
          final point = _toLatLng(alert.coordinates);
          if (point == null) return null;

          Color color = _colorByType(alert.type);

          return Marker(
            point: point,
            width: 24,
            height: 28,
            alignment: Alignment.topCenter, // The point of the pin is at the bottom
            child: GestureDetector(
              onTap: () => _showAlertBottomSheet(alert),
              child: AlertMapPin(
                color: color,
                iconData: _iconByType(alert.type),
                size: 24.0,
              ),
            ),
          );
        })
        .whereType<Marker>()
        .toList();
  }

  void _showAlertBottomSheet(AlertModel alert) {
    if (_isBottomSheetOpen) {
      Navigator.of(context).pop(); // close previous first
    }
    _isBottomSheetOpen = true;
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF262624),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      showDragHandle: true,
      isScrollControlled: true,
      builder: (context) {
        return Consumer<TrackingProvider>(
          builder: (context, trackingProvider, _) {
            final incidentLocation = _toLatLng(alert.coordinates);

            return SingleChildScrollView(
              child: SafeArea(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    AlertCard(
                      alert: alert,
                      isInBottomSheet: true,
                      onContribute: () => _handleContribute(alert),
                    ),
                    if (_isAuthority && incidentLocation != null)
                      Padding(
                        padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                        child: _buildRouteTrackingButton(
                          trackingProvider: trackingProvider,
                          destLat: incidentLocation.latitude,
                          destLng: incidentLocation.longitude,
                          type: alert.type,
                          description: alert.description,
                          reportId: alert.id,
                        ),
                      ),
                  ],
                ),
              ),
            );
          },
        );
      },
    ).then((_) {
      _isBottomSheetOpen = false;
      if (!mounted) return;
      final trackingProvider = Provider.of<TrackingProvider>(context, listen: false);
      if (!trackingProvider.isFollowingRoute) {
        _cancelRouteAndTracking();
      }
    });
  }

  bool _coordsMatch(double? a, double? b) {
    if (a == null || b == null) return false;
    return (a - b).abs() < 0.00001;
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
                    Consumer<RiskZoneProvider>(
                      builder: (context, riskZones, _) {
                        return CircleLayer(
                          circles: riskZones.enabled
                              ? _buildRiskZoneCircles(riskZones.zones)
                              : const <CircleMarker<Object>>[],
                        );
                      },
                    ),
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

                    // Ruta de navegación (autoridad)
                    Consumer<TrackingProvider>(
                      builder: (context, trackingProvider, _) {
                        if (trackingProvider.incidentLatitude == null ||
                            trackingProvider.incidentLongitude == null ||
                            trackingProvider.routePoints.isEmpty) {
                          return const SizedBox.shrink();
                        }

                        AlertModel? alert;
                        for (final a in _alerts) {
                          if (a.coordinates.length >= 2 &&
                              _coordsMatch(
                                a.coordinates[1],
                                trackingProvider.incidentLatitude,
                              ) &&
                              _coordsMatch(
                                a.coordinates[0],
                                trackingProvider.incidentLongitude,
                              )) {
                            alert = a;
                            break;
                          }
                        }
                        if (alert == null && widget.initialAlert != null) {
                          final a = widget.initialAlert!;
                          if (a.coordinates.length >= 2 &&
                              _coordsMatch(
                                a.coordinates[1],
                                trackingProvider.incidentLatitude,
                              ) &&
                              _coordsMatch(
                                a.coordinates[0],
                                trackingProvider.incidentLongitude,
                              )) {
                            alert = a;
                          }
                        }
                        alert ??= AlertModel(
                          id: 0,
                          userId: '',
                          type: trackingProvider.incidentType ?? '',
                          description: trackingProvider.incidentDescription ?? '',
                          coordinates: [
                            trackingProvider.incidentLongitude ?? 0.0,
                            trackingProvider.incidentLatitude ?? 0.0,
                          ],
                          weight: 0.0,
                          verified: false,
                          images: const [],
                          zone: '',
                          createdAt: DateTime.now(),
                        );

                        return PolylineLayer(
                          hitNotifier: _polylineHitNotifier,
                          minimumHitbox: 15.0,
                          polylines: [
                            Polyline(
                              points: trackingProvider.routePoints,
                              strokeWidth: 6,
                              color: trackingProvider.isLoadingRoute
                                  ? Colors.grey
                                  : const Color(0xFFAF6D58),
                              strokeCap: StrokeCap.round,
                              strokeJoin: StrokeJoin.round,
                              hitValue: alert,
                            ),
                          ],
                        );
                      },
                    ),

                    MarkerLayer(
                      markers: [
                        ..._buildEmergencyStationMarkers(),
                        ..._buildAlertMarkers(),
                        if (_locationFromGps) ..._buildTrackingMarkers(context),
                      ],
                    ),
                  ],
                ),

          if (!_locationFromGps && currentLocation != null)
            Positioned(
              bottom: 16,
              left: 12,
              right: 88,
              child: Center(
                child: GestureDetector(
                  onTap: _centerOnUser,
                  child: Material(
                    color: Colors.black54,
                    borderRadius: BorderRadius.circular(12),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 8,
                      ),
                      child: Text(
                        'Sin GPS: mapa centrado en Santa Cruz. Toca aquí para reintentar obtener ubicación.',
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
            ),

          Positioned(
            top: MediaQuery.paddingOf(context).top + 16,
            left: 12,
            right: 12,
            child: Consumer<RiskZoneProvider>(
              builder: (context, riskZoneProvider, _) {
                final showRiskZone = riskZoneProvider.loaded;
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    if (_isAuthority) ...[
                      Center(
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
                                'Vista autoridad · ${filterAlertsForMap(_alerts).length} en mapa · ${_alerts.length} total',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                    ],
                    if (showRiskZone) ...[
                      const RiskZoneOverlay(),
                    ],
                  ],
                );
              },
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
            onPressed: _centerOnUser,
            child: Center(
              child: Container(
                width: 30,
                height: 30,
                decoration: BoxDecoration(
                  color: const Color(0xFFAF6D58).withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Container(
                    width: 10,
                    height: 10,
                    decoration: const BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                    ),
                  ),
                ),
              ),
            ),
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

class AlertMapPin extends StatelessWidget {
  final Color color;
  final IconData iconData;
  final double size;

  const AlertMapPin({
    super.key,
    required this.color,
    required this.iconData,
    this.size = 48.0,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size * 1.16, // Height is slightly larger than width to accommodate the pin tip
      child: CustomPaint(
        painter: TeardropPinPainter(color: color),
        child: Container(
          padding: EdgeInsets.only(bottom: size * 0.16), // Shift icon upward to center it in the circular head
          child: Center(
            child: Icon(
              iconData,
              color: Colors.white,
              size: size * 0.52,
            ),
          ),
        ),
      ),
    );
  }
}

class TeardropPinPainter extends CustomPainter {
  final Color color;

  TeardropPinPainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final width = size.width;
    final height = size.height;
    final r = width / 2;

    // Define the teardrop path
    final path = ui.Path();
    path.moveTo(width / 2, height);
    
    // Bottom point is at (width/2, height).
    // Curve to the right edge (width, r)
    path.cubicTo(
      width * 0.85, height * 0.82,
      width, height * 0.64,
      width, r,
    );
    
    // Top circle arc from (width, r) to (0, r)
    path.arcToPoint(
      Offset(0, r),
      radius: Radius.circular(r),
      clockwise: false,
    );
    
    // Curve from left edge (0, r) back to the bottom point
    path.cubicTo(
      0, height * 0.64,
      width * 0.15, height * 0.82,
      width / 2, height,
    );
    
    path.close();

    // Draw shadow
    final shadowPaint = Paint()
      ..color = Colors.black.withValues(alpha: 0.25)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 4);
    
    canvas.save();
    canvas.translate(0, 2);
    canvas.drawPath(path, shadowPaint);
    canvas.restore();

    // Draw white background of the pin
    final bgPaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.fill;
    canvas.drawPath(path, bgPaint);

    // Draw the inner circle
    final innerCircleRadius = r * 0.82;
    final innerCirclePaint = Paint()
      ..color = color
      ..style = PaintingStyle.fill;
    
    canvas.drawCircle(Offset(width / 2, r), innerCircleRadius, innerCirclePaint);
  }

  @override
  bool shouldRepaint(covariant TeardropPinPainter oldDelegate) {
    return oldDelegate.color != color;
  }
}
