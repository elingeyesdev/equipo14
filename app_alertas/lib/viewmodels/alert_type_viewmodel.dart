import 'package:flutter/foundation.dart';
import 'package:app_alertas/models/alert_type_model.dart';
import 'package:app_alertas/repositories/alert_type_repository.dart';

class AlertTypeViewModel extends ChangeNotifier {
  final AlertTypeRepository _repository;

  AlertTypeViewModel({AlertTypeRepository? repository})
      : _repository = repository ?? AlertTypeRepository();

  List<AlertTypeModel> _alertTypes = [];
  bool _isLoading = false;
  String? _error;

  List<AlertTypeModel> get alertTypes => _alertTypes;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> fetchAlertTypes() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _alertTypes = await _repository.getAlertTypes();
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
