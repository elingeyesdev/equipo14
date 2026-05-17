import 'package:app_alertas/models/alert_type_model.dart';
import 'package:app_alertas/services/alert_type_service.dart';

class AlertTypeRepository {
  final AlertTypeService _service;

  AlertTypeRepository({AlertTypeService? service})
      : _service = service ?? AlertTypeService();

  Future<List<AlertTypeModel>> getAlertTypes() async {
    return await _service.getAlertTypes();
  }
}
