import 'dart:convert';

import 'package:app_alertas/data/models/user_model.dart';
import 'package:app_alertas/data/services/auth_service.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class AuthRepository {
  AuthRepository({
    AuthService? authService,
    FlutterSecureStorage? secureStorage,
  }) : _authService = authService ?? AuthService(),
       _secureStorage = secureStorage ?? const FlutterSecureStorage();

  final AuthService _authService;
  final FlutterSecureStorage _secureStorage;

  static const _accessTokenKey = 'access_token';
  static const _refreshTokenKey = 'refresh_token';
  static const _userKey = 'session_user';

  Future<UserModel> loginUser({
    required String phone,
    required String password,
  }) async {
    final user = await _authService.loginUser(phone: phone, password: password);
    await _saveSession(
      user: user,
      accessToken: _authService.accessToken,
      refreshToken: _authService.refreshToken,
    );
    return user;
  }

  Future<UserModel> registerUser({
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
    await _saveSession(
      user: user,
      accessToken: _authService.accessToken,
      refreshToken: _authService.refreshToken,
    );
    return user;
  }

  Future<SessionData?> loadSession() async {
    final accessToken = await _secureStorage.read(key: _accessTokenKey);
    final refreshToken = await _secureStorage.read(key: _refreshTokenKey);
    final userJson = await _secureStorage.read(key: _userKey);

    if (accessToken == null || refreshToken == null || userJson == null) {
      return null;
    }

    final decoded = jsonDecode(userJson);
    if (decoded is! Map<String, dynamic>) return null;

    return SessionData(
      accessToken: accessToken,
      refreshToken: refreshToken,
      user: UserModel.fromJson(decoded),
    );
  }

  Future<void> clearSession() async {
    await _secureStorage.delete(key: _accessTokenKey);
    await _secureStorage.delete(key: _refreshTokenKey);
    await _secureStorage.delete(key: _userKey);
  }

  Future<void> _saveSession({
    required UserModel user,
    required String? accessToken,
    required String? refreshToken,
  }) async {
    if (accessToken == null || accessToken.isEmpty) {
      throw Exception('No se recibio access token.');
    }
    if (refreshToken == null || refreshToken.isEmpty) {
      throw Exception('No se recibio refresh token.');
    }

    await _secureStorage.write(key: _accessTokenKey, value: accessToken);
    await _secureStorage.write(key: _refreshTokenKey, value: refreshToken);
    await _secureStorage.write(key: _userKey, value: jsonEncode(user.toJson()));
  }
}

class SessionData {
  const SessionData({
    required this.accessToken,
    required this.refreshToken,
    required this.user,
  });

  final String accessToken;
  final String refreshToken;
  final UserModel user;
}
