class ApiConfig {
  /// Web / Windows / iOS Simulator: `localhost`. Emulador Android: `http://10.0.2.2:3000`.
  static const String baseUrl = 'http://localhost:3000';

  static const String usersPath = '/users';
  static const String reportsPath = '/reports';

  /// UUID de un usuario existente en el backend (creado para pruebas locales).
  static const String defaultUserId =
      '43a834bf-d2d5-421d-92a0-0ab6225b9a76';
}
