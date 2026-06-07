import 'package:flutter_dotenv/flutter_dotenv.dart';

class ApiConstants {
  static String get apiBaseUrl => dotenv.env['API_BASE_URL'] ?? '';

  static String get mapboxToken => dotenv.env['MAPBOX_ACCESS_TOKEN'] ?? '';
}
