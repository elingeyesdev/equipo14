import 'dart:convert';

import 'package:flutter_foreground_task/flutter_foreground_task.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';

import 'package:app_alertas/core/risk_zones.dart';
import 'package:app_alertas/services/risk_zone_task_handler.dart';

class RiskZoneMonitorService {
  RiskZoneMonitorService._();
  static final RiskZoneMonitorService instance = RiskZoneMonitorService._();

  bool _initialized = false;

  Future<void> ensureInitialized() async {
    if (_initialized) return;
    FlutterForegroundTask.init(
      androidNotificationOptions: AndroidNotificationOptions(
        channelId: 'risk_zone_monitor',
        channelName: 'Monitoreo de zonas',
        channelDescription: 'Detecta cuando entras en zonas de riesgo',
        channelImportance: NotificationChannelImportance.LOW,
        priority: NotificationPriority.LOW,
      ),
      iosNotificationOptions: const IOSNotificationOptions(
        showNotification: false,
        playSound: false,
      ),
      foregroundTaskOptions: ForegroundTaskOptions(
        eventAction: ForegroundTaskEventAction.repeat(15000),
        autoRunOnBoot: false,
        allowWakeLock: true,
        allowWifiLock: true,
      ),
    );
    _initialized = true;
  }

  Future<void> syncZones(List<RiskZone> zones, {required bool enabled}) async {
    await ensureInitialized();
    await FlutterForegroundTask.saveData(
      key: zonesDataKey,
      value: jsonEncode(zones.map((z) => z.toJson()).toList()),
    );
    await FlutterForegroundTask.saveData(key: enabledDataKey, value: enabled);

    if (!enabled) {
      final corridorsRaw =
          await FlutterForegroundTask.getData<String>(key: corridorsDataKey);
      final hasCorridors = corridorsRaw != null && corridorsRaw.isNotEmpty;
      if (!hasCorridors && await FlutterForegroundTask.isRunningService) {
        await FlutterForegroundTask.stopService();
      }
      return;
    }

    await _ensureServiceRunning();
  }

  Future<void> syncCorridors(List<Map<String, dynamic>> corridors) async {
    await ensureInitialized();
    await FlutterForegroundTask.saveData(
      key: corridorsDataKey,
      value: jsonEncode(corridors),
    );

    if (corridors.isEmpty) {
      final zonesRaw = await FlutterForegroundTask.getData<String>(key: zonesDataKey);
      final enabled = await FlutterForegroundTask.getData<bool>(key: enabledDataKey) ?? false;
      if ((zonesRaw == null || zonesRaw.isEmpty || !enabled) &&
          await FlutterForegroundTask.isRunningService) {
        await FlutterForegroundTask.stopService();
      }
      return;
    }

    await FlutterForegroundTask.saveData(key: enabledDataKey, value: true);
    await _ensureServiceRunning();
  }

  Future<void> _ensureServiceRunning() async {
    if (await FlutterForegroundTask.isRunningService) return;

    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }

    await FlutterForegroundTask.startService(
      serviceId: 22001,
      notificationTitle: 'Alertas · Monitoreo',
      notificationText: 'Monitoreando tu ubicación',
      callback: riskZoneTaskCallback,
    );
  }

  Stream<LatLng> locationStream() {
    return Geolocator.getPositionStream(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.medium,
        distanceFilter: 15,
      ),
    ).map((p) => LatLng(p.latitude, p.longitude));
  }
}
