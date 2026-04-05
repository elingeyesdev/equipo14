import 'api_config_vm.dart'
    if (dart.library.html) 'api_config_web.dart' as loopback;

/// Configuración de API (puerto alineado con `PORT` del backend, por defecto 3000).
class ApiConfig {
  static const int defaultPort = 3000;

  /// Base URL del backend Nest. En el emulador de Android Studio usa `10.0.2.2`.
  static String get baseUrl =>
      'http://${loopback.apiLoopbackHost()}:$defaultPort';

  static const String usersPath = '/users';
  static const String reportsPath = '/reports';

  /// UUID de un usuario existente en el backend (creado para pruebas locales).
  static const String defaultUserId =
      '43a834bf-d2d5-421d-92a0-0ab6225b9a76';
}
