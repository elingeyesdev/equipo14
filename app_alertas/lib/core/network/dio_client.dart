import 'package:dio/dio.dart';
import 'package:app_alertas/core/constants/api_constants.dart';
import 'package:app_alertas/services/secure_storage_service.dart';

class DioClient {
  late final Dio _dio;
  final SecureStorageService _storage = SecureStorageService();

  DioClient() {
    _dio = Dio(
      BaseOptions(
        baseUrl: ApiConstants.baseUrl,
        connectTimeout: const Duration(seconds: 10),
        receiveTimeout: const Duration(seconds: 10),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'x-tunnel-skip-warning': 'true',
          'ngrok-skip-browser-warning': 'true',
        },
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _storage.getAccessToken();
          final authHeader = 'Bearer $token';
          options.headers['Authorization'] = authHeader;
          return handler.next(options);
        },
      ),
    );

    // Add interceptors for logging or auth if needed
    _dio.interceptors.add(LogInterceptor(
      requestBody: true,
      responseBody: true,
    ));
  }

  Dio get dio => _dio;
}

final dioClient = DioClient();


