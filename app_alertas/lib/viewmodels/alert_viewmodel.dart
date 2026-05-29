import 'dart:io';
import 'package:flutter/material.dart';
import 'package:app_alertas/models/alert_model.dart';
import 'package:app_alertas/repositories/alert_repository.dart';

class AlertViewModel extends ChangeNotifier {
  final AlertRepository _repository;

  AlertViewModel({AlertRepository? repository})
      : _repository = repository ?? AlertRepository();

  List<AlertModel> _alerts = [];
  List<AlertModel> get alerts => _alerts;

  List<AlertModel> _myAlerts = [];
  List<AlertModel> get myAlerts => _myAlerts;

  bool _isLoading = false;
  bool get isLoading => _isLoading;

  String? _error;
  String? get error => _error;

  Future<void> fetchAlerts() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _alerts = await _repository.getAlerts();
      // Sort by newer first
      _alerts.sort((a, b) {
        if (a.createdAt == null || b.createdAt == null) return 0;
        return b.createdAt!.compareTo(a.createdAt!);
      });
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchMyAlerts(String userId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _myAlerts = await _repository.getAlertsByUser(userId);
      // Sort by newer first
      _myAlerts.sort((a, b) {
        if (a.createdAt == null || b.createdAt == null) return 0;
        return b.createdAt!.compareTo(a.createdAt!);
      });
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchNearbyAlerts({
    required double latitude,
    required double longitude,
    required int radius,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _alerts = await _repository.getNearbyAlerts(
        latitude: latitude,
        longitude: longitude,
        radius: radius,
      );
      // Sort by newer first
      _alerts.sort((a, b) {
        if (a.createdAt == null || b.createdAt == null) return 0;
        return b.createdAt!.compareTo(a.createdAt!);
      });
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
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
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final alert = await _repository.createAlert(
        typeId: typeId,
        description: description,
        userId: userId,
        latitude: latitude,
        longitude: longitude,
        zone: zone,
        imageFile: imageFile,
      );
      // Insert at first place
      _alerts.insert(0, alert);
      _myAlerts.insert(0, alert);
      return alert;
    } catch (e) {
      _error = e.toString();
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<List<AlertModel>> findSimilarAlerts({
    required int typeId,
    required double latitude,
    required double longitude,
  }) async {
    try {
      return await _repository.findSimilarAlerts(
        typeId: typeId,
        latitude: latitude,
        longitude: longitude,
      );
    } catch (e) {
      _error = e.toString();
      rethrow;
    }
  }

  Future<void> attachImageToReport({
    required int reportId,
    required String userId,
    required File imageFile,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await _repository.attachImageToReport(
        reportId: reportId,
        userId: userId,
        imageFile: imageFile,
      );
    } catch (e) {
      _error = e.toString();
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<AlertModel> verifyReport(int reportId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final updatedAlert = await _repository.verifyReport(reportId);
      final index = _alerts.indexWhere((a) => a.id == reportId);
      if (index != -1) {
        _alerts[index] = updatedAlert;
      }
      return updatedAlert;
    } catch (e) {
      _error = e.toString();
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> deleteReport(int reportId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await _repository.deleteReport(reportId);
      _alerts.removeWhere((a) => a.id == reportId);
      _myAlerts.removeWhere((a) => a.id == reportId);
    } catch (e) {
      _error = e.toString();
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
