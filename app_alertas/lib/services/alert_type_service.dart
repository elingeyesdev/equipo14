import 'package:dio/dio.dart';
import 'package:app_alertas/core/network/dio_client.dart';
import 'package:app_alertas/models/alert_type_model.dart';

class AlertTypeService {
  final Dio _dio;

  AlertTypeService({Dio? dio}) : _dio = dio ?? dioClient.dio;

  Future<List<AlertTypeModel>> getAlertTypes() async {
    final response = await _dio.get('/report-types');
    final List<dynamic> data = response.data;
    return data.map((json) => AlertTypeModel.fromJson(json)).toList();
  }
}
