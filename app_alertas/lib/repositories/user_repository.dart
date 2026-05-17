import 'package:app_alertas/services/user_service.dart';

class UserRepository {
  final UserService _service;

  UserRepository({UserService? service}) : _service = service ?? UserService();

  Future<void> updateLocation(
    String id, {
    required double latitude,
    required double longitude,
  }) async {
    await _service.updateLocation(id, latitude: latitude, longitude: longitude);
  }

  Future<void> updateFcmToken(String id, String fcmToken) async {
    await _service.updateFcmToken(id, fcmToken);
  }
}
