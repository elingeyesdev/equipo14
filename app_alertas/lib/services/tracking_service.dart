import 'package:firebase_database/firebase_database.dart';
import 'package:flutter/foundation.dart';

class TrackingService {
  final DatabaseReference _dbRef = FirebaseDatabase.instance.ref().child('trackings');

  /// Crea o actualiza un documento de tracking en tiempo real.
  /// [trackingId] puede ser el ID del reporte o un ID único por vehículo.
  /// [data] debe contener latitud, longitud, tipo de vehículo y opcionalmente la ruta.
  Future<void> startTracking(String trackingId, Map<String, dynamic> data) async {
    try {
      await _dbRef.child(trackingId).set({
        ...data,
        'timestamp': ServerValue.timestamp,
      });
      debugPrint('Tracking guardado en Firebase: $trackingId (${data['status']})');
    } catch (e) {
      debugPrint('Error starting tracking: $e');
    }
  }

  /// Elimina el documento de tracking para que desaparezca del mapa.
  Future<void> stopTracking(String trackingId) async {
    try {
      await _dbRef.child(trackingId).remove();
    } catch (e) {
      debugPrint('Error stopping tracking: $e');
    }
  }

  /// Escucha todos los vehículos de emergencia activos.
  Stream<List<Map<String, dynamic>>> streamTrackings() {
    return _dbRef.onValue.map((event) {
      final snapshot = event.snapshot;
      if (snapshot.value == null) {
        return [];
      }
      
      final trackings = <Map<String, dynamic>>[];
      final dataMap = snapshot.value as Map<dynamic, dynamic>;
      
      dataMap.forEach((key, value) {
        final Map<String, dynamic> trackingData = Map<String, dynamic>.from(value as Map);
        trackingData['id'] = key;
        trackings.add(trackingData);
      });
      
      return trackings;
    });
  }
}
