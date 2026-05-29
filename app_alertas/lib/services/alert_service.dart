import 'dart:io';
import 'package:dio/dio.dart';
import 'package:app_alertas/core/network/dio_client.dart';
import 'package:app_alertas/models/alert_model.dart';

class AlertService {
  final Dio _dio;

  AlertService({Dio? dio}) : _dio = dio ?? dioClient.dio;

  Future<List<AlertModel>> getAlerts() async {
    final response = await _dio.get('/reports');
    final List<dynamic> data = response.data;
    return data.map((json) => AlertModel.fromJson(json)).toList();
  }

  Future<List<AlertModel>> getAlertsByUser(String userId) async {
    final response = await _dio.get('/reports/user/$userId');
    final List<dynamic> data = response.data;
    return data.map((json) => AlertModel.fromJson(json)).toList();
  }

  Future<List<AlertModel>> getNearbyAlerts({
    required double latitude,
    required double longitude,
    required int radius,
  }) async {
    final response = await _dio.get(
      '/reports/nearby',
      queryParameters: {
        'latitude': latitude,
        'longitude': longitude,
        'radius': radius,
      },
    );
    final List<dynamic> data = response.data;
    return data.map((json) => AlertModel.fromJson(json)).toList();
  }

  Future<AlertModel> createAlert({
    required int typeId,
    required String description,
    required String userId,
    required double latitude,
    required double longitude,
    String? zone,
    File? imageFile,
  }) async {
    final formData = FormData.fromMap({
      'type': typeId.toString(),
      'description': description,
      'userId': userId,
      'latitude': latitude.toString(),
      'longitude': longitude.toString(),
      'zone': ?zone,
    });

    if (imageFile != null) {
      formData.files.add(MapEntry(
        'image',
        await MultipartFile.fromFile(imageFile.path),
      ));
    }

    final response = await _dio.post('/reports', data: formData);
    return AlertModel.fromJson(response.data);
  }

  Future<List<AlertModel>> findSimilarAlerts({
    required int typeId,
    required double latitude,
    required double longitude,
    required String userId,
  }) async {
    final response = await _dio.get(
      '/reports/similars',
      queryParameters: {
        'type': typeId.toString(),
        'latitude': latitude.toString(),
        'longitude': longitude.toString(),
        'userId': userId,
      },
    );
    final List<dynamic> data = response.data;
    return data.map((json) => AlertModel.fromJson(json)).toList();
  }

  Future<void> attachImageToReport({
    required int reportId,
    required String userId,
    required File imageFile,
  }) async {
    final formData = FormData();
    formData.files.add(MapEntry(
      'image',
      await MultipartFile.fromFile(imageFile.path),
    ));

    await _dio.post('/reports/$reportId/images/$userId', data: formData);
  }

  Future<AlertModel> verifyReport(int reportId) async {
    final response = await _dio.patch('/reports/$reportId/verify');
    return AlertModel.fromJson(response.data);
  }

  Future<void> deleteReport(int reportId) async {
    await _dio.delete('/reports/$reportId');
  }
}
