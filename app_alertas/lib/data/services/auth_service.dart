import 'package:app_alertas/data/models/user_model.dart';
import 'package:app_alertas/data/services/api_service.dart';

class AuthService {
  AuthService({ApiService? apiService}) : _apiService = apiService ?? ApiService();

  final ApiService _apiService;

  Future<UserModel> login({
    required String phone,
    required String password,
  }) async {
    final users = await _apiService.obtenerUsuarios();
    final normalizedPhone = phone.trim();

    final user = users.where((u) => u.phone == normalizedPhone).firstOrNull;
    if (user == null) {
      throw Exception('No existe un usuario con ese numero.');
    }

    if (password.trim().length < 6) {
      throw Exception('La contrasena debe tener al menos 6 caracteres.');
    }

    return user;
  }

  Future<UserModel> register({
    required String firstName,
    required String lastName,
    required String phone,
    required String password,
  }) {
    return _apiService.crearUsuario(
      firstName: firstName,
      lastName: lastName,
      phone: phone,
      password: password,
    );
  }
}
