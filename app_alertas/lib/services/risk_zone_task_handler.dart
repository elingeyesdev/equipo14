import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter_foreground_task/flutter_foreground_task.dart';
import 'package:geolocator/geolocator.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:latlong2/latlong.dart';

import 'package:app_alertas/core/risk_zones.dart';
import 'package:app_alertas/core/route_corridor.dart';

const zonesDataKey = 'risk_zones_json';
const enabledDataKey = 'risk_zones_enabled';
const corridorsDataKey = 'route_corridors_json';

@pragma('vm:entry-point')
void riskZoneTaskCallback() {
  FlutterForegroundTask.setTaskHandler(RiskZoneTaskHandler());
}

class RiskZoneTaskHandler extends TaskHandler {
  final FlutterLocalNotificationsPlugin _notifications =
      FlutterLocalNotificationsPlugin();
  final Set<String> _activeZoneIds = {};
  final Set<String> _activeCorridorIds = {};
  bool _notificationsReady = false;

  Future<void> _ensureNotifications() async {
    if (_notificationsReady) return;
    const android = AndroidInitializationSettings('@mipmap/ic_launcher');
    await _notifications.initialize(settings: const InitializationSettings(android: android));
    _notificationsReady = true;
  }

  Future<List<RiskZone>> _loadZones() async {
    final raw = await FlutterForegroundTask.getData<String>(key: zonesDataKey);
    if (raw == null || raw.isEmpty) return [];
    try {
      final list = jsonDecode(raw) as List<dynamic>;
      return list
          .map((e) => RiskZone.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList();
    } catch (e) {
      debugPrint('RiskZoneTaskHandler parse error: $e');
      return [];
    }
  }

  Future<bool> _isEnabled() async {
    return await FlutterForegroundTask.getData<bool>(key: enabledDataKey) ?? false;
  }

  Future<List<RouteCorridor>> _loadCorridors() async {
    final raw = await FlutterForegroundTask.getData<String>(key: corridorsDataKey);
    if (raw == null || raw.isEmpty) return [];
    try {
      final list = jsonDecode(raw) as List<dynamic>;
      return list
          .map((e) => RouteCorridor.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList();
    } catch (e) {
      debugPrint('RiskZoneTaskHandler corridor parse error: $e');
      return [];
    }
  }

  Future<void> _notifyEntry(RiskZone zone) async {
    await _ensureNotifications();
    HapticFeedback.heavyImpact();
    final pct = (zone.riskIndex * 100).round();
    final level = riskLevelLabel(zone.riskIndex);
    await _notifications.show(
      id: zone.id.hashCode,
      title: 'Zona de riesgo · $level',
      body: 'Entraste en ${zone.name} · índice $pct%',
      notificationDetails: NotificationDetails(
        android: AndroidNotificationDetails(
          'risk_zone_channel',
          'Zonas de riesgo',
          channelDescription: 'Advertencias al entrar en zonas de riesgo',
          importance: Importance.high,
          priority: Priority.high,
          icon: '@mipmap/ic_launcher',
          enableVibration: true,
          vibrationPattern: Int64List.fromList([0, 500, 200, 500]),
        ),
      ),
    );
  }

  Future<void> _notifyCorridorEntry(RouteCorridor corridor) async {
    await _ensureNotifications();
    HapticFeedback.heavyImpact();
    await _notifications.show(
      id: corridor.id.hashCode,
      title: 'Unidad de emergencia en camino',
      body: 'Hay una unidad respondiendo a «${corridor.label}» cerca de tu ubicación.',
      notificationDetails: NotificationDetails(
        android: AndroidNotificationDetails(
          'route_corridor_channel',
          'Rutas de emergencia',
          channelDescription: 'Avisos cuando una unidad pasa cerca de ti',
          importance: Importance.high,
          priority: Priority.high,
          icon: '@mipmap/ic_launcher',
          enableVibration: true,
          vibrationPattern: Int64List.fromList([0, 400, 150, 400, 150, 600]),
        ),
      ),
    );
  }

  Future<void> _checkLocation() async {
    final zones = await _loadZones();
    final corridors = await _loadCorridors();
    final zonesEnabled = await _isEnabled();
    if (!zonesEnabled && corridors.isEmpty) return;

    try {
      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.medium,
      );
      final point = LatLng(position.latitude, position.longitude);
      final insideZoneIds = <String>{};
      final insideCorridorIds = <String>{};

      if (zonesEnabled) {
        for (final zone in zones) {
        final dist = Geolocator.distanceBetween(
          position.latitude,
          position.longitude,
          zone.lat,
          zone.lng,
        );
        if (dist <= zone.radiusMeters) {
          insideZoneIds.add(zone.id);
          if (!_activeZoneIds.contains(zone.id)) {
            await _notifyEntry(zone);
          }
        }
      }
      }

      for (final corridor in corridors) {
        if (isInsideRouteCorridor(point, corridor.points)) {
          insideCorridorIds.add(corridor.id);
          if (!_activeCorridorIds.contains(corridor.id)) {
            await _notifyCorridorEntry(corridor);
          }
        }
      }

      _activeZoneIds
        ..clear()
        ..addAll(insideZoneIds);
      _activeCorridorIds
        ..clear()
        ..addAll(insideCorridorIds);

      if (insideCorridorIds.isNotEmpty) {
        final corridor = corridors.firstWhere(
          (c) => insideCorridorIds.contains(c.id),
        );
        await FlutterForegroundTask.updateService(
          notificationText: 'Unidad en ruta · ${corridor.label}',
        );
        FlutterForegroundTask.sendDataToMain({
          'type': 'risk_zone_update',
          'riskIndex': 0.0,
          'zoneName': null,
          'zoneId': null,
        });
      } else if (insideZoneIds.isNotEmpty) {
        final top = zones
            .where((z) => insideZoneIds.contains(z.id))
            .reduce((a, b) => a.riskIndex >= b.riskIndex ? a : b);
        await FlutterForegroundTask.updateService(
          notificationText:
              '${riskLevelLabel(top.riskIndex)} · ${top.name} · ${(top.riskIndex * 100).round()}%',
        );
        FlutterForegroundTask.sendDataToMain({
          'type': 'risk_zone_update',
          'riskIndex': top.riskIndex,
          'zoneName': top.name,
          'zoneId': top.id,
        });
      } else {
        await FlutterForegroundTask.updateService(
          notificationText: 'Monitoreando ubicación',
        );
        FlutterForegroundTask.sendDataToMain({
          'type': 'risk_zone_update',
          'riskIndex': 0.0,
          'zoneName': null,
          'zoneId': null,
        });
      }
    } catch (e) {
      debugPrint('RiskZoneTaskHandler location error: $e');
    }
  }

  @override
  Future<void> onStart(DateTime timestamp, TaskStarter starter) async {
    await _checkLocation();
  }

  @override
  void onRepeatEvent(DateTime timestamp) {
    unawaited(_checkLocation());
  }

  @override
  Future<void> onDestroy(DateTime timestamp, bool isTimeout) async {
    _activeZoneIds.clear();
    _activeCorridorIds.clear();
  }

  @override
  void onNotificationButtonPressed(String id) {}

  @override
  void onNotificationPressed() {}

  @override
  void onNotificationDismissed() {}
}
