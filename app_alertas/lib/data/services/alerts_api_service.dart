import 'dart:io';

import 'package:app_alertas/core/config/api_config.dart';
import 'package:app_alertas/data/models/alert_model.dart';
import 'package:app_alertas/data/services/api_service.dart';

/// Compatibilidad con pantallas existentes; delega en [ApiService].
class AlertsApiService {
  AlertsApiService({ApiService? api}) : _api = api ?? ApiService();

  final ApiService _api;

  Future<List<AlertModel>> getAlerts() => _api.obtenerReportes();

  Future<AlertModel> createAlert({
    required String type,
    required String description,
    required String user,
    required double latitude,
    required double longitude,
    File? imageFile,
  }) {
    return _api.crearReporte(
      type: type,
      description: description,
      userId: user,
      latitude: latitude,
      longitude: longitude,
      imageFile: imageFile,
    );
  }

  /// Variante que usa [ApiConfig.defaultUserId] y la posición actual (útil para pruebas rápidas).
  Future<AlertModel> createAlertWithDefaults({
    required String type,
    required String description,
    required double latitude,
    required double longitude,
    File? imageFile,
  }) {
    return createAlert(
      type: type,
      description: description,
      user: ApiConfig.defaultUserId,
      latitude: latitude,
      longitude: longitude,
      imageFile: imageFile,
    );
  }

  Future<void> deleteAlert(int id) => _api.eliminarReporte(id);
}
