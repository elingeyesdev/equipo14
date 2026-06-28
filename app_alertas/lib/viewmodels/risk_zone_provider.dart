import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:latlong2/latlong.dart';

import 'package:app_alertas/core/risk_zones.dart';
import 'package:app_alertas/models/alert_model.dart';
import 'package:app_alertas/services/risk_zone_monitor_service.dart';
import 'package:app_alertas/services/risk_zone_notification_service.dart';

class RiskZoneProvider extends ChangeNotifier {
  final RiskZoneMonitorService _monitor = RiskZoneMonitorService.instance;
  final RiskZoneNotificationService _prefs = RiskZoneNotificationService();

  bool _enabled = true;
  bool _loaded = false;
  List<RiskZone> _zones = const [];
  RiskZone? _currentZone;
  String? _lastZoneId;
  StreamSubscription<LatLng>? _positionSub;

  bool get enabled => _enabled;
  bool get loaded => _loaded;
  List<RiskZone> get zones => _zones;
  RiskZone? get currentZone => _currentZone;
  double? get currentRiskIndex => _currentZone?.riskIndex;

  Future<void> loadPreference() async {
    _enabled = true;
    _loaded = true;
    notifyListeners();
  }

  Future<void> setEnabled(bool value) async {
    if (_enabled == value) return;
    _enabled = value;
    await _prefs.saveEnabledPreference(value);
    if (!value) {
      _currentZone = null;
      await _stopWatching();
      await _monitor.syncZones(_zones, enabled: false);
    } else if (_zones.isNotEmpty) {
      await _startWatching();
    }
    notifyListeners();
  }

  Future<void> updateFromAlerts(List<AlertModel> alerts) async {
    _zones = buildRiskZonesFromAlerts(alerts);
    if (_enabled && _zones.isNotEmpty) {
      if (_positionSub == null) await _startWatching();
      await _monitor.syncZones(_zones, enabled: true);
    } else {
      await _monitor.syncZones(_zones, enabled: false);
    }
    notifyListeners();
  }

  Future<void> _startWatching() async {
    await _monitor.ensureInitialized();
    await _positionSub?.cancel();
    _positionSub = _monitor.locationStream().listen(_onPosition);
    await _monitor.syncZones(_zones, enabled: _enabled);
  }

  Future<void> _stopWatching() async {
    await _positionSub?.cancel();
    _positionSub = null;
  }

  void _onPosition(LatLng position) {
    if (!_enabled || _zones.isEmpty) {
      if (_currentZone != null) {
        _currentZone = null;
        _lastZoneId = null;
        notifyListeners();
      }
      return;
    }
    final nextZone = findContainingZone(position, _zones);
    if (nextZone != null && nextZone.id != _lastZoneId) {
      HapticFeedback.heavyImpact();
    }
    _lastZoneId = nextZone?.id;
    _currentZone = nextZone;
    notifyListeners();
  }

  void updateCurrentZoneFromBackground(double riskIndex, String? zoneName, String? zoneId) {
    if (zoneId == null || riskIndex == 0.0) {
      if (_currentZone != null) {
        _currentZone = null;
        notifyListeners();
      }
    } else {
      final existingIndex = _zones.indexWhere((z) => z.id == zoneId);
      final newZone = existingIndex != -1
          ? _zones[existingIndex]
          : RiskZone(
              id: zoneId,
              name: zoneName ?? 'Área de riesgo',
              lng: 0.0,
              lat: 0.0,
              radiusKm: 0.1,
              reportCount: 1,
              accidentCount: 0,
              riskScore: 0.0,
              riskIndex: riskIndex,
              color: riskIndexToColor(riskIndex),
            );
      if (_currentZone?.id != newZone.id || _currentZone?.riskIndex != newZone.riskIndex) {
        _currentZone = newZone;
        notifyListeners();
      }
    }
  }

  @override
  void dispose() {
    unawaited(_stopWatching());
    super.dispose();
  }
}
