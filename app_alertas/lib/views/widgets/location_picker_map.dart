import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

import 'package:app_alertas/core/config/mapbox_config.dart';

/// Radio máximo permitido en metros para seleccionar la ubicación del incidente.
const double kMaxAlertRadiusMeters = 100.0;

/// Calcula la distancia en metros entre dos coordenadas (fórmula Haversine).
double haversineDistanceMeters(LatLng a, LatLng b) {
  const earthRadius = 6371000.0;
  final dLat = (b.latitude - a.latitude) * math.pi / 180;
  final dLon = (b.longitude - a.longitude) * math.pi / 180;
  final lat1Rad = a.latitude * math.pi / 180;
  final lat2Rad = b.latitude * math.pi / 180;
  final x = math.sin(dLat / 2) * math.sin(dLat / 2) +
      math.cos(lat1Rad) *
          math.cos(lat2Rad) *
          math.sin(dLon / 2) *
          math.sin(dLon / 2);
  final c = 2 * math.atan2(math.sqrt(x), math.sqrt(1 - x));
  return earthRadius * c;
}

/// Widget de selección de ubicación en mapa.
///
/// Muestra:
/// - La posición actual del usuario (marcador azul fijo).
/// - Un círculo semitransparente de 100 m a su alrededor.
/// - Un marcador rojo draggable que representa la ubicación del incidente.
///
/// Notifica cambios mediante [onLocationChanged] con la [LatLng] seleccionada
/// y si está dentro del radio ([isInsideRadius]).
class LocationPickerMap extends StatefulWidget {
  const LocationPickerMap({
    super.key,
    required this.userLocation,
    required this.onLocationChanged,
  });

  /// Ubicación GPS actual del usuario (centro del círculo permitido).
  final LatLng userLocation;

  /// Callback disparado cada vez que el marcador cambia de posición.
  final void Function(LatLng selected, bool isInsideRadius) onLocationChanged;

  @override
  State<LocationPickerMap> createState() => _LocationPickerMapState();
}

class _LocationPickerMapState extends State<LocationPickerMap> {
  late LatLng _selectedPoint;
  final _mapController = MapController();

  bool get _isInsideRadius =>
      haversineDistanceMeters(_selectedPoint, widget.userLocation) <=
      kMaxAlertRadiusMeters;

  @override
  void initState() {
    super.initState();
    // El marcador comienza en la posición del usuario
    _selectedPoint = widget.userLocation;
  }

  void _onMapTap(TapPosition tapPos, LatLng latLng) {
    setState(() => _selectedPoint = latLng);
    widget.onLocationChanged(latLng, _isInsideRadius);
  }

  @override
  Widget build(BuildContext context) {
    final inside = _isInsideRadius;
    final markerColor = inside ? const Color(0xFFAF6D58) : Color(0xFFB64D4C);

    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: SizedBox(
        height: 240,
        child: Stack(
          children: [
            FlutterMap(
              mapController: _mapController,
              options: MapOptions(
                initialCenter: widget.userLocation,
                initialZoom: 17.5,
                onTap: _onMapTap,
                // Mantener el mapa centrado al inicio; el usuario puede mover
                interactionOptions: const InteractionOptions(
                  flags: InteractiveFlag.all,
                ),
              ),
              children: [
                // Capa de tiles Mapbox dark
                MapboxConfig.darkTileLayer(),

                // Círculo del área permitida (100 m)
                CircleLayer(
                  circles: [
                    CircleMarker(
                      point: widget.userLocation,
                      radius: kMaxAlertRadiusMeters,
                      useRadiusInMeter: true,
                      color: const Color(0xFFAF6D58).withValues(alpha: 0.12),
                      borderColor: const Color(0xFFAF6D58).withValues(alpha: 0.55),
                      borderStrokeWidth: 2,
                    ),
                  ],
                ),

                // Marcadores
                MarkerLayer(
                  markers: [
                    // Marcador del usuario (fijo)
                    Marker(
                      point: widget.userLocation,
                      width: 30,
                      height: 30,
                      child: Container(
                        decoration: BoxDecoration(
                          color: const Color(0xFFAF6D58),
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 2),
                        ),
                        child: const Icon(
                          Icons.my_location_rounded,
                          color: Colors.white,
                          size: 14,
                        ),
                      ),
                    ),

                    // Marcador del incidente (movible al tocar)
                    Marker(
                      point: _selectedPoint,
                      width: 52,
                      height: 60,
                      alignment: Alignment.topCenter,
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 38,
                            height: 38,
                            decoration: BoxDecoration(
                              color: markerColor,
                              shape: BoxShape.circle,
                              border: Border.all(color: Colors.white, width: 2),
                              boxShadow: [
                                BoxShadow(
                                  color: markerColor.withValues(alpha: 0.55),
                                  blurRadius: 10,
                                  spreadRadius: 2,
                                ),
                              ],
                            ),
                            child: const Icon(
                              Icons.warning_rounded,
                              color: Colors.white,
                              size: 20,
                            ),
                          ),
                          // "Cola" del pin
                          Container(
                            width: 3,
                            height: 10,
                            decoration: BoxDecoration(
                              color: markerColor,
                              borderRadius: BorderRadius.circular(2),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),

            // Instrucción flotante en la parte superior
            Positioned(
              top: 10,
              left: 10,
              right: 10,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: const Color(0xFF262624).withValues(alpha: 0.88),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.touch_app_rounded, color: Color(0xFFAF6D58), size: 12),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Toca el mapa para ubicar el incidente (máx. 100 m)',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Badge de estado (dentro/fuera del radio)
            Positioned(
              bottom: 10,
              right: 10,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: inside
                      ? Color(0xFF3C8C6E)
                      : Color(0xFFB64D4C),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      inside
                          ? Icons.check_circle_rounded
                          : Icons.cancel_rounded,
                      color: const Color.fromARGB(255, 255, 255, 255),
                      size: 14,
                    ),
                    const SizedBox(width: 5),
                    Text(
                      inside ? 'Dentro del área' : 'Fuera del área',
                      style: TextStyle(
                        color: const Color.fromARGB(255, 255, 255, 255),
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
