import 'package:dio/dio.dart';
import 'package:app_alertas/core/network/dio_client.dart';
import 'package:app_alertas/models/user_model.dart';

class AuthService {
  final Dio _dio;

  AuthService({Dio? dio}) : _dio = dio ?? dioClient.dio;

  String? accessToken;
  String? refreshToken;

  Future<UserModel> login({
    required String phone,
    required String password,
  }) async {
    final response = await _dio.post(
      '/auth/login',
      data: {
        'phone': phone,
        'password': password,
      },
    );

    final data = response.data;
    accessToken = data['access_token'];
    refreshToken = data['refresh_token'];

    return UserModel.fromJson(data['user']);
  }

  Future<UserModel> register({
    required String firstName,
    required String lastName,
    required String phone,
    required String password,
    required int roleId,
  }) async {
    final response = await _dio.post(
      '/auth/register',
      data: {
        'first_name': firstName,
        'last_name': lastName,
        'phone': phone,
        'password': password,
        'roleId': roleId,
      },
    );

    final data = response.data;
    accessToken = data['access_token'];
    refreshToken = data['refresh_token'];

    return UserModel.fromJson(data['user']);
  }

  Future<String?> refresh({
    required String refreshToken,
  }) async {
    final response = await _dio.post(
      '/auth/refresh',
      data: {
        'refresh_token': refreshToken,
      },
    );

    final data = response.data;
    accessToken = data['access_token'];
    if (data['refresh_token'] != null) {
      this.refreshToken = data['refresh_token'];
    }
    return accessToken;
  }

  Future<UserModel> getMe() async {
    final response = await _dio.get('/auth/me');
    return UserModel.fromJson(response.data);
  }
}
