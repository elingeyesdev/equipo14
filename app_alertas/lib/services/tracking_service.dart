import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;

class TrackingService {
  late IO.Socket _socket;
  final _trackingsController = StreamController<List<Map<String, dynamic>>>.broadcast();

  TrackingService() {
    _initSocket();
  }

  void _initSocket() {
    final String baseUrl = dotenv.env['API_BASE_URL'] ?? 'http://localhost:3000';
    // Strip '/api' prefix from baseUrl if present
    final String socketUrl = baseUrl.replaceAll('/api', '');

    _socket = IO.io(socketUrl, IO.OptionBuilder()
      .setTransports(['websocket'])
      .enableAutoConnect()
      .build());

    _socket.onConnect((_) {
      debugPrint('Conectado al servidor de WebSockets');
      // Solicitar los trackings actuales al reconectarse
      _socket.emit('getTrackings');
    });

    _socket.onDisconnect((_) {
      debugPrint('Desconectado del servidor de WebSockets');
    });

    _socket.on('trackings', (data) {
      try {
        if (data is List) {
          final List<Map<String, dynamic>> trackings = data.map((item) {
            return Map<String, dynamic>.from(item as Map);
          }).toList();
          _trackingsController.add(trackings);
        }
      } catch (e) {
        debugPrint('Error parseando trackings en WebSockets: $e');
      }
    });
  }

  /// Crea o actualiza un documento de tracking en tiempo real.
  /// [trackingId] es el ID de usuario o un ID único por vehículo.
  /// [data] contiene latitud, longitud, tipo de vehículo y la ruta.
  Future<void> startTracking(String trackingId, Map<String, dynamic> data) async {
    try {
      _socket.emit('startTracking', {
        'userId': trackingId,
        ...data,
      });
      debugPrint('Tracking emitido via WebSockets: $trackingId (${data['status']})');
    } catch (e) {
      debugPrint('Error starting tracking in WebSockets: $e');
    }
  }

  /// Elimina el documento de tracking para que desaparezca del mapa.
  Future<void> stopTracking(String trackingId) async {
    try {
      _socket.emit('stopTracking', {
        'userId': trackingId,
      });
      debugPrint('Stop tracking emitido via WebSockets: $trackingId');
    } catch (e) {
      debugPrint('Error stopping tracking in WebSockets: $e');
    }
  }

  /// Escucha todos los vehículos de emergencia activos.
  Stream<List<Map<String, dynamic>>> streamTrackings() {
    // Pedir trackings al suscribirse
    if (_socket.connected) {
      _socket.emit('getTrackings');
    }
    return _trackingsController.stream;
  }
}
