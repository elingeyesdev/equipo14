import 'package:flutter/foundation.dart';
import 'package:app_alertas/models/user_model.dart';
import 'package:app_alertas/repositories/auth_repository.dart';
import 'package:app_alertas/services/auth_service.dart';
import 'package:app_alertas/services/secure_storage_service.dart';
import 'package:app_alertas/services/reports_socket_service.dart';
import 'package:app_alertas/services/tracking_service.dart';

class AuthViewModel extends ChangeNotifier {
  final AuthRepository _repository;

  AuthViewModel({AuthRepository? repository})
      : _repository = repository ??
            AuthRepository(
              authService: AuthService(),
              storage: SecureStorageService(),
            );

  UserModel? _user;
  bool _isLoading = false;
  bool _isInitialized = false;

  UserModel? get user => _user;
  bool get isLoading => _isLoading;
  bool get isInitialized => _isInitialized;
  bool get isAuthenticated => _user != null;

  Future<void> initializeSession() async {
    if (_isInitialized) return;
    _isLoading = true;
    notifyListeners();

    try {
      final loggedIn = await _repository.isLoggedIn();
      if (loggedIn) {
        // Al iniciar la app, intentamos refrescar la sesión.
        // Si el refresco es exitoso, marcamos al usuario como autenticado.
        final token = await _repository.refreshSession();
        if (token != null) {
          _user = await _repository.getProfile();
          ReportsSocketService().connect();
          TrackingService().connect();
        } else {
          await logout();
        }
      }
    } catch (_) {
      await logout();
    } finally {
      _isLoading = false;
      _isInitialized = true;
      notifyListeners();
    }
  }

  Future<void> login({
    required String phone,
    required String password,
  }) async {
    _isLoading = true;
    notifyListeners();

    try {
      final loggedUser = await _repository.login(
        phone: phone,
        password: password,
      );
      _user = loggedUser;
      ReportsSocketService().connect();
      TrackingService().connect();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> register({
    required String firstName,
    required String lastName,
    required String phone,
    required String password,
    int roleId = 1,
  }) async {
    _isLoading = true;
    notifyListeners();

    try {
      final registeredUser = await _repository.register(
        firstName: firstName,
        lastName: lastName,
        phone: phone,
        password: password,
        roleId: roleId,
      );
      _user = registeredUser;
      ReportsSocketService().connect();
      TrackingService().connect();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    _isLoading = true;
    notifyListeners();

    try {
      await _repository.logout();
      _user = null;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> updateProfile({
    required String firstName,
    required String lastName,
  }) async {
    _isLoading = true;
    notifyListeners();

    try {
      if (_user == null) return;
      final updatedUser = await _repository.updateProfile(
        id: _user!.id,
        firstName: firstName,
        lastName: lastName,
      );
      _user = updatedUser;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    _isLoading = true;
    notifyListeners();

    try {
      if (_user == null) return;
      await _repository.changePassword(
        id: _user!.id,
        currentPassword: currentPassword,
        newPassword: newPassword,
      );
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
