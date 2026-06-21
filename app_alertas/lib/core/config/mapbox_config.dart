import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

import '../constants/api_constants.dart';

/// Configuración centralizada de Mapbox (tiles raster para flutter_map).
class MapboxConfig {
  MapboxConfig._();

  static const userAgentPackageName = 'com.tuempresa.appalertas.app_alertas';

  /// Centro por defecto: Santa Cruz de la Sierra
  static const defaultCenter = LatLng(-17.7833, -63.1812);

  /// Mismo token público que web/AndroidManifest (fallback si .env vacío).
  static const defaultAccessToken =
      'pk.eyJ1IjoiZWxvam9zZGVhcnJveiIsImEiOiJjbW5lbjNoZm4wMTRoMnNxM2RuZG1jdm9uIn0.nErIU6_OLUsQyg77y6geKA';

  static String get accessToken {
    final fromEnv = ApiConstants.mapboxToken.trim();
    return fromEnv.isNotEmpty ? fromEnv : defaultAccessToken;
  }

  static String get darkTileUrl =>
      'https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/256/{z}/{x}/{y}'
      '?access_token=$accessToken';

  static String get lightTileUrl =>
      'https://api.mapbox.com/styles/v1/mapbox/light-v11/tiles/256/{z}/{x}/{y}'
      '?access_token=$accessToken';

  static const String _osmFallbackUrl =
      'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

  static TileLayer darkTileLayer() {
    return TileLayer(
      urlTemplate: darkTileUrl,
      fallbackUrl: _osmFallbackUrl,
      userAgentPackageName: userAgentPackageName,
      maxNativeZoom: 22,
      maxZoom: 22,
    );
  }

  static TileLayer lightTileLayer() {
    return TileLayer(
      urlTemplate: lightTileUrl,
      fallbackUrl: _osmFallbackUrl,
      userAgentPackageName: userAgentPackageName,
      maxNativeZoom: 22,
      maxZoom: 22,
    );
  }

  static TileLayer tileLayer(dynamic context) {
    // context can be BuildContext or theme brightness check
    final isDark = context is Brightness
        ? context == Brightness.dark
        : (context is ColorScheme ? context.brightness == Brightness.dark : Theme.of(context).brightness == Brightness.dark);
    return isDark ? darkTileLayer() : lightTileLayer();
  }
}
