import 'package:app_alertas/data/models/user_model.dart';
import 'package:app_alertas/data/services/api_service.dart';

class AuthService {
  AuthService({ApiService? apiService})
    : _apiService = apiService ?? ApiService();

  final ApiService _apiService;
  String? _accessToken;
  String? _refreshToken;

  String? get accessToken => _accessToken;
  String? get refreshToken => _refreshToken;

  Future<UserModel> login({
    required String phone,
    required String password,
  }) async {
    return loginUser(phone: phone, password: password);
  }

  Future<UserModel> register({
    required String firstName,
    required String lastName,
    required String phone,
    required String password,
  }) async {
    final roleId = await _resolveRoleId(const ['usuario', 'user'], fallback: 2);
    final data = await _apiService.register(
      firstName: firstName,
      lastName: lastName,
      phone: phone,
      password: password,
      roleId: roleId,
    );
    return _parseAuthResponse(data);
  }

  Future<UserModel> loginUser({
    required String phone,
    required String password,
  }) async {
    try {
      final normalizedPhone = phone.trim();
      final normalizedPassword = password.trim();
      if (normalizedPhone.isEmpty || normalizedPassword.isEmpty) {
        throw Exception('Completa telefono y contrasena.');
      }
      final data = await _apiService.login(
        phone: normalizedPhone,
        password: normalizedPassword,
      );
      return _parseAuthResponse(data);
    } on Exception catch (e) {
      throw Exception(_friendlyError(e));
    }
  }

  Future<UserModel> loginAuthority({
    required String credential,
    required String password,
  }) async {
    // El backend actual autentica por phone en /auth/login.
    return loginUser(phone: credential, password: password);
  }

  Future<UserModel> registerAuthority({
    required String firstName,
    required String lastName,
    required String phone,
    required String password,
  }) async {
    final roleId = await _resolveRoleId(const [
      'autoridad',
      'authority',
      'admin',
    ], fallback: 1);
    final data = await _apiService.register(
      firstName: firstName,
      lastName: lastName,
      phone: phone,
      password: password,
      roleId: roleId,
    );
    return _parseAuthResponse(data);
  }

  UserModel _parseAuthResponse(Map<String, dynamic> data) {
    final userJson = data['user'];
    if (userJson is! Map<String, dynamic>) {
      throw Exception('No se recibio informacion del usuario.');
    }
    _accessToken = (data['access_token'] ?? '').toString();
    _refreshToken = (data['refresh_token'] ?? '').toString();
    return UserModel.fromJson(userJson);
  }

  Future<int> _resolveRoleId(
    List<String> candidates, {
    required int fallback,
  }) async {
    try {
      final roles = await _apiService.obtenerRoles();
      for (final role in roles) {
        final name = (role['name'] ?? '').toString().toLowerCase();
        if (candidates.any((candidate) => name.contains(candidate))) {
          final id = int.tryParse((role['id'] ?? '').toString());
          if (id != null) return id;
        }
      }
      return fallback;
    } catch (_) {
      return fallback;
    }
  }

  String _friendlyError(Exception error) {
    final message = error.toString().replaceFirst('Exception: ', '');
    if (message.contains('401') ||
        message.toLowerCase().contains('unauthorized')) {
      return 'Credenciales incorrectas.';
    }
    if (message.contains('404') ||
        message.toLowerCase().contains('usuario no encontrado')) {
      return 'Usuario no encontrado.';
    }
    if (message.contains('Contrasena Incorrecta')) {
      return 'Contrasena incorrecta.';
    }
    if (message.contains('SocketException')) {
      return 'No se pudo conectar al servidor.';
    }
    return message;
  }
}
