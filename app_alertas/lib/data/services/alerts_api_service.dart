import 'dart:io';

import 'package:app_alertas/core/config/api_config.dart';
import 'package:app_alertas/data/models/alert_model.dart';
import 'package:app_alertas/data/models/alert_type.model.dart';
import 'package:app_alertas/data/services/api_service.dart';

/// Compatibilidad con pantallas existentes; delega en [ApiService].
class AlertsApiService {
  AlertsApiService({ApiService? api}) : _api = api ?? ApiService();

  final ApiService _api;

  Future<List<AlertModel>> getAlerts() => _api.obtenerReportes();

  /// Obtiene la lista de tipos de alerta desde el backend.
  Future<List<ReportTypeModel>> getAlertTypes() => _api.obtenerTiposDeAlerta();

  Future<AlertModel> createAlert({
    required int typeId,
    required String description,
    required String user,
    required double latitude,
    required double longitude,
    File? imageFile,
  }) {
    return _api.crearReporte(
      typeId: typeId,
      description: description,
      userId: user,
      latitude: latitude,
      longitude: longitude,
      imageFile: imageFile,
    );
  }

  /// Variante que usa [ApiConfig.defaultUserId] y la posición actual (útil para pruebas rápidas).
  Future<AlertModel> createAlertWithDefaults({
    required int typeId,
    required String description,
    required double latitude,
    required double longitude,
    File? imageFile,
  }) {
    return createAlert(
      typeId: typeId,
      description: description,
      user: ApiConfig.defaultUserId,
      latitude: latitude,
      longitude: longitude,
      imageFile: imageFile,
    );
  }

  Future<void> deleteAlert(int id) => _api.eliminarReporte(id);
}
