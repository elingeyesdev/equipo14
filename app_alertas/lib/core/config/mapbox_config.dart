import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

/// Configuración centralizada de Mapbox (tiles raster para flutter_map).
class MapboxConfig {
  MapboxConfig._();

  /// Token público válido para desarrollo si falta o es inválido el de .env
  static const defaultAccessToken =
      'pk.eyJ1IjoiZWxvam9zZGVhcnJveiIsImEiOiJjbW5lbjNoZm4wMTRoMnNxM2RuZG1jdm9uIn0.nErIU6_OLUsQyg77y6geKA';

  static const _invalidPrefixes = ['pk.eyJ1IjoiZGF2aWRlbmNl'];

  static const userAgentPackageName = 'com.tuempresa.appalertas.app_alertas';

  /// Centro por defecto: Santa Cruz de la Sierra
  static const defaultCenter = LatLng(-17.7833, -63.1812);

  static String get accessToken {
    final fromEnv = dotenv.env['MAPBOX_ACCESS_TOKEN']?.trim() ?? '';
    if (fromEnv.isEmpty) return defaultAccessToken;
    for (final prefix in _invalidPrefixes) {
      if (fromEnv.startsWith(prefix)) return defaultAccessToken;
    }
    return fromEnv;
  }

  static String get darkTileUrl =>
      'https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/256/{z}/{x}/{y}'
      '?access_token=$accessToken';

  static TileLayer darkTileLayer() => TileLayer(
        urlTemplate: darkTileUrl,
        userAgentPackageName: userAgentPackageName,
        maxNativeZoom: 22,
        maxZoom: 22,
      );
}