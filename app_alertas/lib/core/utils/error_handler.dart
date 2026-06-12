import 'package:dio/dio.dart';

/// Convierte cualquier excepción o error en un mensaje comprensible para el usuario.
String parseError(dynamic error) {
  if (error is DioException) {
    if (error.response != null) {
      final data = error.response!.data;
      if (data is Map<String, dynamic>) {
        if (data.containsKey('message') && data['message'] != null) {
          return data['message'].toString();
        }
        if (data.containsKey('error') && data['error'] != null) {
          return data['error'].toString();
        }
      }
      if (error.response!.statusMessage != null &&
          error.response!.statusMessage!.isNotEmpty) {
        return error.response!.statusMessage!;
      }
      return 'Error del servidor (${error.response!.statusCode})';
    }

    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return 'Tiempo de espera agotado. Verifica tu conexión.';
      case DioExceptionType.connectionError:
        return 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
      case DioExceptionType.cancel:
        return 'Petición cancelada.';
      default:
        return 'Error de red. Inténtalo de nuevo.';
    }
  }

  // Eliminar prefijo "Exception: " si existe
  final errorStr = error.toString();
  if (errorStr.startsWith('Exception: ')) {
    return errorStr.replaceFirst('Exception: ', '');
  }
  return errorStr;
}
