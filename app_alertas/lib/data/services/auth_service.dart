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
    required int roleId,
  }) async {
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

  /// Punto de extension para refresh token en proximas iteraciones.
  Future<String?> refreshAccessToken() async {
    // TODO: Consumir /auth/refresh usando _refreshToken cuando se active ese flujo.
    return null;
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
