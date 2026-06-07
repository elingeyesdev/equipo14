import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../constants/api_constants.dart';

/// Configuración centralizada de Mapbox (tiles raster para flutter_map).
class MapboxConfig {
  MapboxConfig._();

  static const userAgentPackageName = 'com.tuempresa.appalertas.app_alertas';

  /// Centro por defecto: Santa Cruz de la Sierra
  static const defaultCenter = LatLng(-17.7833, -63.1812);

  static String get accessToken => ApiConstants.mapboxToken;

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