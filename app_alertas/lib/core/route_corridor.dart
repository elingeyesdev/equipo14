import 'dart:math' as math;

import 'package:latlong2/latlong.dart';

const routeCorridorRadiusMeters = 250.0;

class RouteCorridor {
  final String id;
  final String label;
  final List<LatLng> points;

  const RouteCorridor({
    required this.id,
    required this.label,
    required this.points,
  });

  factory RouteCorridor.fromJson(Map<String, dynamic> json) {
    final rawPoints = json['points'] as List<dynamic>? ?? const [];
    return RouteCorridor(
      id: (json['id'] ?? '').toString(),
      label: (json['label'] ?? 'Emergencia').toString(),
      points: rawPoints
          .map(
            (p) => LatLng(
              (p['lat'] as num).toDouble(),
              (p['lng'] as num).toDouble(),
            ),
          )
          .toList(),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'label': label,
    'points': points
        .map((p) => {'lat': p.latitude, 'lng': p.longitude})
        .toList(),
  };
}

double distanceToRouteMeters(LatLng point, List<LatLng> route) {
  if (route.length < 2) return double.infinity;

  var minDistance = double.infinity;
  for (var i = 0; i < route.length - 1; i++) {
    final segmentDistance = _distanceToSegment(point, route[i], route[i + 1]);
    if (segmentDistance < minDistance) {
      minDistance = segmentDistance;
    }
  }
  return minDistance;
}

bool isInsideRouteCorridor(
  LatLng point,
  List<LatLng> route, {
  double radiusMeters = routeCorridorRadiusMeters,
}) {
  return distanceToRouteMeters(point, route) <= radiusMeters;
}

double _distanceToSegment(LatLng point, LatLng start, LatLng end) {
  const earthRadius = 6371000.0;
  final lat1 = _toRadians(start.latitude);
  final lon1 = _toRadians(start.longitude);
  final lat2 = _toRadians(end.latitude);
  final lon2 = _toRadians(end.longitude);
  final lat3 = _toRadians(point.latitude);
  final lon3 = _toRadians(point.longitude);

  final dLat = lat2 - lat1;
  final dLon = lon2 - lon1;

  if (dLat.abs() < 1e-12 && dLon.abs() < 1e-12) {
    return _haversineMeters(point, start);
  }

  final t = math.max(
    0,
    math.min(
      1,
      ((lat3 - lat1) * dLat + (lon3 - lon1) * dLon) /
          (dLat * dLat + dLon * dLon),
    ),
  );

  final projLat = lat1 + t * dLat;
  final projLon = lon1 + t * dLon;
  return _haversineFromRadians(lat3, lon3, projLat, projLon, earthRadius);
}

double _haversineMeters(LatLng a, LatLng b) {
  return _haversineFromRadians(
    _toRadians(a.latitude),
    _toRadians(a.longitude),
    _toRadians(b.latitude),
    _toRadians(b.longitude),
    6371000.0,
  );
}

double _haversineFromRadians(
  double lat1,
  double lon1,
  double lat2,
  double lon2,
  double earthRadius,
) {
  final dLat = lat2 - lat1;
  final dLon = lon2 - lon1;
  final x = math.sin(dLat / 2) * math.sin(dLat / 2) +
      math.cos(lat1) * math.cos(lat2) * math.sin(dLon / 2) * math.sin(dLon / 2);
  return earthRadius * 2 * math.atan2(math.sqrt(x), math.sqrt(1 - x));
}

double _toRadians(double degrees) => degrees * math.pi / 180;
