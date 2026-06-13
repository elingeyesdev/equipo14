import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class RiskZoneNotificationService {
  static const _enabledKey = 'risk_zones_enabled';
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  Future<bool> loadEnabledPreference({bool defaultValue = true}) async {
    final raw = await _storage.read(key: _enabledKey);
    if (raw == null) return defaultValue;
    return raw == 'true';
  }

  Future<void> saveEnabledPreference(bool enabled) async {
    await _storage.write(key: _enabledKey, value: enabled.toString());
  }
}
