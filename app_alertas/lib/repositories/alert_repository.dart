import 'dart:io';
import 'package:app_alertas/models/alert_model.dart';
import 'package:app_alertas/services/alert_service.dart';

class AlertRepository {
  final AlertService _service;

  AlertRepository({AlertService? service})
      : _service = service ?? AlertService();

  Future<List<AlertModel>> getAlerts() async {
    return await _service.getAlerts();
  }

  Future<List<AlertModel>> getAlertsByUser(String userId) async {
    return await _service.getAlertsByUser(userId);
  }

  Future<List<AlertModel>> getNearbyAlerts({
    required double latitude,
    required double longitude,
    required int radius,
  }) async {
    return await _service.getNearbyAlerts(
      latitude: latitude,
      longitude: longitude,
      radius: radius,
    );
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
    return await _service.createAlert(
      typeId: typeId,
      description: description,
      userId: userId,
      latitude: latitude,
      longitude: longitude,
      zone: zone,
      imageFile: imageFile,
    );
  }

  Future<List<AlertModel>> findSimilarAlerts({
    required int typeId,
    required double latitude,
    required double longitude,
  }) async {
    return await _service.findSimilarAlerts(
      typeId: typeId,
      latitude: latitude,
      longitude: longitude,
    );
  }

  Future<void> attachImageToReport({
    required int reportId,
    required String userId,
    required File imageFile,
  }) async {
    await _service.attachImageToReport(
      reportId: reportId,
      userId: userId,
      imageFile: imageFile,
    );
  }

  Future<AlertModel> verifyReport(int reportId) async {
    return await _service.verifyReport(reportId);
  }
}
