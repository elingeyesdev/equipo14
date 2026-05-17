import 'package:dio/dio.dart';
import 'package:app_alertas/core/network/dio_client.dart';

class UserService {
  final Dio _dio;

  UserService({Dio? dio}) : _dio = dio ?? dioClient.dio;

  Future<void> updateLocation(
    String id, {
    required double latitude,
    required double longitude,
  }) async {
    await _dio.patch(
      '/users/$id/location',
      data: {
        'latitude': latitude,
        'longitude': longitude,
      },
    );
  }

  Future<void> updateFcmToken(String id, String fcmToken) async {
    await _dio.patch(
      '/users/$id/fcm-token',
      data: {
        'fcm_token': fcmToken,
      },
    );
  }
}
