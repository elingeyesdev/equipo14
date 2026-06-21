import 'dart:math' as math;
import 'dart:ui';

import 'package:app_alertas/models/alert_model.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';

const double riskGridKm = 0.25;
const double _minRadiusKm = 0.08;
const double _maxRadiusKm = 0.22;

const _accidentHints = ['accidente', 'choque', 'colisión', 'tránsito', 'transito'];

class RiskZone {
  final String id;
  final String name;
  final double lng;
  final double lat;
  final double radiusKm;
  final int reportCount;
  final int accidentCount;
  final double riskScore;
  final double riskIndex;
  final Color color;

  const RiskZone({
    required this.id,
    required this.name,
    required this.lng,
    required this.lat,
    required this.radiusKm,
    required this.reportCount,
    required this.accidentCount,
    required this.riskScore,
    required this.riskIndex,
    required this.color,
  });

  LatLng get center => LatLng(lat, lng);
  double get radiusMeters => radiusKm * 1000;

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'lng': lng,
        'lat': lat,
        'radiusKm': radiusKm,
        'reportCount': reportCount,
        'accidentCount': accidentCount,
        'riskScore': riskScore,
        'riskIndex': riskIndex,
      };

  factory RiskZone.fromJson(Map<String, dynamic> json) {
    final index = (json['riskIndex'] as num?)?.toDouble() ?? 0;
    return RiskZone(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Área de riesgo',
      lng: (json['lng'] as num?)?.toDouble() ?? 0,
      lat: (json['lat'] as num?)?.toDouble() ?? 0,
      radiusKm: (json['radiusKm'] as num?)?.toDouble() ?? _minRadiusKm,
      reportCount: json['reportCount'] as int? ?? 0,
      accidentCount: json['accidentCount'] as int? ?? 0,
      riskScore: (json['riskScore'] as num?)?.toDouble() ?? 0,
      riskIndex: index,
      color: riskIndexToColor(index),
    );
  }
}

({double lat, double lng}) _kmPerDegree(double lat) {
  return (lat: 111.32, lng: 111.32 * math.cos(lat * math.pi / 180));
}

String _gridKey(double lng, double lat) {
  final scale = _kmPerDegree(lat);
  final gx = (lng * scale.lng / riskGridKm).floor();
  final gy = (lat * scale.lat / riskGridKm).floor();
  return '$gx:$gy';
}

bool _isAccidentReport(AlertModel report) {
  final name = report.type.toLowerCase();
  return _accidentHints.any(name.contains);
}

double _reportRiskWeight(AlertModel report) {
  var w = report.weight > 0 ? report.weight : 1.0;
  if (report.verified) w *= 1.25;
  return w;
}

/// Verde (bajo) → amarillo (medio) → rojo (alto)
Color riskIndexToColor(double index) {
  const green = Color.fromRGBO(34, 197, 94, 1);
  const yellow = Color.fromRGBO(234, 179, 8, 1);
  const red = Color.fromRGBO(239, 68, 68, 1);
  final t = index.clamp(0.0, 1.0);
  if (t <= 0.5) return Color.lerp(green, yellow, t * 2)!;
  return Color.lerp(yellow, red, (t - 0.5) * 2)!;
}

String riskLevelLabel(double index) {
  if (index < 0.34) return 'Bajo';
  if (index < 0.67) return 'Medio';
  return 'Alto';
}

String _dominantZoneLabel(List<AlertModel> reports) {
  final counts = <String, int>{};
  for (final r in reports) {
    final label = (r.zone?.trim().isNotEmpty == true) ? r.zone!.trim() : 'Zona sin nombre';
    counts[label] = (counts[label] ?? 0) + 1;
  }
  var best = 'Área de riesgo';
  var max = 0;
  counts.forEach((label, n) {
    if (n > max) {
      max = n;
      best = label;
    }
  });
  return best;
}

double _radiusFromCount(int count) {
  final t = (count / 12).clamp(0.0, 1.0);
  return _minRadiusKm + t * (_maxRadiusKm - _minRadiusKm);
}

({double lng, double lat})? normalizeReportCoordinates(List<double> coords) {
  if (coords.length < 2) return null;
  final a = coords[0];
  final b = coords[1];
  if (!a.isFinite || !b.isFinite) return null;

  bool inSczLng(double v) => v >= -63.55 && v <= -62.75;
  bool inSczLat(double v) => v >= -18.15 && v <= -17.35;

  final candidates = <({double lng, double lat})>[(lng: a, lat: b)];
  if (inSczLat(a) && inSczLng(b)) candidates.add((lng: b, lat: a));

  for (final c in candidates) {
    if (inSczLng(c.lng) && inSczLat(c.lat)) return c;
  }
  return (lng: a, lat: b);
}

List<RiskZone> buildRiskZonesFromAlerts(List<AlertModel> alerts) {
  final buckets = <String, ({List<AlertModel> reports, double lngSum, double latSum, int n})>{};

  for (final report in alerts) {
    final pos = normalizeReportCoordinates(report.coordinates);
    if (pos == null) continue;
    final key = _gridKey(pos.lng, pos.lat);
    final bucket = buckets[key];
    if (bucket == null) {
      buckets[key] = (reports: [report], lngSum: pos.lng, latSum: pos.lat, n: 1);
    } else {
      buckets[key] = (
        reports: [...bucket.reports, report],
        lngSum: bucket.lngSum + pos.lng,
        latSum: bucket.latSum + pos.lat,
        n: bucket.n + 1,
      );
    }
  }

  final zones = <RiskZone>[];

  buckets.forEach((key, bucket) {
    if (bucket.n == 0) return;
    final lng = bucket.lngSum / bucket.n;
    final lat = bucket.latSum / bucket.n;
    final accidentCount = bucket.reports.where(_isAccidentReport).length;
    final riskScore = bucket.reports.fold<double>(0, (sum, r) => sum + _reportRiskWeight(r));

    zones.add(
      RiskZone(
        id: key,
        name: _dominantZoneLabel(bucket.reports),
        lng: lng,
        lat: lat,
        radiusKm: _radiusFromCount(bucket.n),
        reportCount: bucket.n,
        accidentCount: accidentCount,
        riskScore: riskScore,
        riskIndex: 0,
        color: riskIndexToColor(0),
      ),
    );
  });

  if (zones.isEmpty) return zones;

  const double standardMaxScore = 22.0;

  return zones
      .map((z) {
        final riskIndex = (z.riskScore / standardMaxScore).clamp(0.0, 1.0);
        return RiskZone(
          id: z.id,
          name: z.name,
          lng: z.lng,
          lat: z.lat,
          radiusKm: z.radiusKm,
          reportCount: z.reportCount,
          accidentCount: z.accidentCount,
          riskScore: z.riskScore,
          riskIndex: riskIndex,
          color: riskIndexToColor(riskIndex),
        );
      })
      .toList()
    ..sort((a, b) => b.riskIndex.compareTo(a.riskIndex));
}

RiskZone? findContainingZone(LatLng position, List<RiskZone> zones) {
  RiskZone? best;
  var bestIndex = -1.0;
  for (final zone in zones) {
    final dist = Geolocator.distanceBetween(
      position.latitude,
      position.longitude,
      zone.lat,
      zone.lng,
    );
    if (dist <= zone.radiusMeters && zone.riskIndex > bestIndex) {
      best = zone;
      bestIndex = zone.riskIndex;
    }
  }
  return best;
}
