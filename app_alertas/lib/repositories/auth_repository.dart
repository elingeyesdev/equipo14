import 'package:app_alertas/models/user_model.dart';
import 'package:app_alertas/services/auth_service.dart';
import 'package:app_alertas/services/secure_storage_service.dart';
import 'package:app_alertas/services/reports_socket_service.dart';
import 'package:app_alertas/services/tracking_service.dart';

class AuthRepository {

  final AuthService _authService;
  final SecureStorageService _storage;

  AuthRepository({
    required AuthService authService,
    required SecureStorageService storage,
  })  : _authService = authService,
        _storage = storage;

  Future<UserModel> login({
    required String phone,
    required String password,
  }) async {

    final user = await _authService.login(
      phone: phone,
      password: password,
    );

    final accessToken = _authService.accessToken;
    final refreshToken = _authService.refreshToken;

    if (accessToken == null || refreshToken == null) {
      throw Exception('Tokens inválidos.');
    }

    // guardar sesión
    await _storage.saveTokens(
      accessToken: accessToken,
      refreshToken: refreshToken,
    );

    return user;
  }

  Future<UserModel> register({
    required String firstName,
    required String lastName,
    required String phone,
    required String password,
    required int roleId,
  }) async {

    final user = await _authService.register(
      firstName: firstName,
      lastName: lastName,
      phone: phone,
      password: password,
      roleId: roleId,
    );

    final accessToken = _authService.accessToken;
    final refreshToken = _authService.refreshToken;

    if (accessToken == null || refreshToken == null) {
      throw Exception('Tokens inválidos.');
    }

    await _storage.saveTokens(
      accessToken: accessToken,
      refreshToken: refreshToken,
    );

    return user;
  }

  Future<void> logout() async {
    await _authService.logout();
    await _storage.clearTokens();
    ReportsSocketService().disconnect();
    TrackingService().disconnect();
  }

  Future<bool> isLoggedIn() async {

    final token = await _storage.getAccessToken();

    return token != null && token.isNotEmpty;
  }

  Future<String?> refreshSession() async {

    final refreshToken =
        await _storage.getRefreshToken();

    if (refreshToken == null) {
      return null;
    }

    final newAccessToken =
        await _authService.refresh(
      refreshToken: refreshToken,
    );

    if (newAccessToken == null) {
      await logout();
      return null;
    }

    await _storage.saveTokens(
      accessToken: newAccessToken,
      refreshToken:
          _authService.refreshToken ?? refreshToken,
    );

    return newAccessToken;
  }

  Future<UserModel> getProfile() async {
    return await _authService.getMe();
  }
}