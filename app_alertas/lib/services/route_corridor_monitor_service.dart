import 'dart:async';

import 'package:app_alertas/core/route_corridor.dart';
import 'package:app_alertas/services/risk_zone_monitor_service.dart';
import 'package:app_alertas/services/tracking_service.dart';
import 'package:latlong2/latlong.dart';

class RouteCorridorMonitorService {
  RouteCorridorMonitorService._();
  static final RouteCorridorMonitorService instance =
      RouteCorridorMonitorService._();

  final TrackingService _trackingService = TrackingService();
  StreamSubscription<List<Map<String, dynamic>>>? _trackingSub;
  String? _currentUserId;

  Future<void> start(String? userId) async {
    _currentUserId = userId;
    await _trackingSub?.cancel();
    _trackingSub = _trackingService.streamTrackings().listen(_onTrackings);
  }

  Future<void> stop() async {
    await _trackingSub?.cancel();
    _trackingSub = null;
    await RiskZoneMonitorService.instance.syncCorridors(const []);
  }

  void _onTrackings(List<Map<String, dynamic>> vehicles) {
    final corridors = <RouteCorridor>[];

    for (final vehicle in vehicles) {
      if (vehicle['id'] == _currentUserId) continue;

      final status = (vehicle['status'] ?? '').toString();
      if (status != 'active' && status != 'planned') continue;

      final routeRaw = vehicle['route'];
      if (routeRaw is! List || routeRaw.length < 2) continue;

      final parsedPoints = <LatLng>[];
      for (final point in routeRaw) {
        if (point is! Map) continue;
        final lat = (point['lat'] as num?)?.toDouble();
        final lng = (point['lng'] as num?)?.toDouble();
        if (lat == null || lng == null) continue;
        parsedPoints.add(LatLng(lat, lng));
      }

      if (parsedPoints.length < 2) continue;

      corridors.add(
        RouteCorridor(
          id: (vehicle['id'] ?? '').toString(),
          label: (vehicle['type'] ?? 'Emergencia').toString(),
          points: parsedPoints,
        ),
      );
    }

    unawaited(
      RiskZoneMonitorService.instance.syncCorridors(
        corridors.map((c) => c.toJson()).toList(),
      ),
    );
  }
}
