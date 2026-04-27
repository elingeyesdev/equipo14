import 'api_config_vm.dart'
    if (dart.library.html) 'api_config_web.dart'
    as loopback;

/// Configuración de API (puerto alineado con `PORT` del backend, por defecto 3000).
class ApiConfig {
  static const int defaultPort = 3000;
  static const String apiPrefix = '/api';
  static const bool useDevTunnel = false;
  static const String devTunnelBaseUrl =
      'https://srbd68d5-3000.brs.devtunnels.ms';

  /// Base URL del backend Nest. En el emulador de Android Studio usa `10.0.2.2`.
  static String get baseUrl => useDevTunnel
      ? '$devTunnelBaseUrl$apiPrefix'
      : 'http://${loopback.apiLoopbackHost()}:$defaultPort$apiPrefix';

  static const String usersPath = '/users';
  static const String authPath = '/auth';
  static const String rolesPath = '/roles';
  static const String reportsPath = '/reports';
  static const String reportSimilarsPath = '/reports/similars';
  static const String reportTypesPath = '/report-types';

  /// UUID de un usuario existente en el backend (creado para pruebas locales).
  /// cambiar esto por q la base de datos fue borrada alvrga xd
  static const String defaultUserId = '1717ef84-b2c9-4e50-9c0a-686f8eff0dd9';
}
