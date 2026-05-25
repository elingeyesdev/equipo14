import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';

/// Extiende LatLng para incluir el bearing (dirección de desplazamiento).
class PositionWithBearing {
  final LatLng latLng;
  final double bearing;

  const PositionWithBearing({required this.latLng, required this.bearing});
}

class LocationService {
  const LocationService();

  Future<void> ensureLocationAccess() async {
    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      throw const LocationException(
        'Activa los servicios de ubicacion para continuar.',
      );
    }

    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }

    if (permission == LocationPermission.denied) {
      throw const LocationException('Permiso de ubicacion denegado.');
    }

    if (permission == LocationPermission.deniedForever) {
      throw const LocationException(
        'Permiso de ubicacion denegado permanentemente.',
      );
    }
  }

  Future<LatLng> getCurrentLocation() async {
    await ensureLocationAccess();

    final position = await Geolocator.getCurrentPosition(
      desiredAccuracy: LocationAccuracy.high,
    );

    return LatLng(position.latitude, position.longitude);
  }

  Future<Stream<LatLng>> getLocationStream() async {
    await ensureLocationAccess();
    return Geolocator.getPositionStream(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.bestForNavigation,
        distanceFilter: 5,
      ),
    ).map((position) => LatLng(position.latitude, position.longitude));
  }

  /// Stream con bearing incluido para animación del vehículo.
  Future<Stream<PositionWithBearing>> getPositionStream() async {
    await ensureLocationAccess();
    return Geolocator.getPositionStream(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.bestForNavigation,
        distanceFilter: 5,
      ),
    ).map(
      (position) => PositionWithBearing(
        latLng: LatLng(position.latitude, position.longitude),
        bearing: position.heading,
      ),
    );
  }
}

class LocationException implements Exception {
  final String message;
  const LocationException(this.message);

  @override
  String toString() => message;
}
