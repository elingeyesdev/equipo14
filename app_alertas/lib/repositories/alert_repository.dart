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

  Future<void> attachImageToReport(int reportId, File imageFile) async {
    await _service.attachImageToReport(reportId, imageFile);
  }

  Future<AlertModel> verifyReport(int reportId) async {
    return await _service.verifyReport(reportId);
  }

  Future<List<AlertModel>> getReportsByZone(String zoneName) async {
    return await _service.getReportsByZone(zoneName);
  }
}
