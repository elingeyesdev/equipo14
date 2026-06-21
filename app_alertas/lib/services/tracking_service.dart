import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;

class TrackingService {
  static final TrackingService _instance = TrackingService._internal();
  factory TrackingService() => _instance;

  TrackingService._internal();

  IO.Socket? _socket;
  final _trackingsController = StreamController<List<Map<String, dynamic>>>.broadcast();
  final List<Map<String, dynamic>> _activeTrackings = [];
  bool _isConnected = false;

  void connect() {
    if (_isConnected && _socket != null && _socket!.connected) {
      debugPrint('WebSockets de Tracking ya está conectado o conectándose');
      return;
    }
    _initSocket();
  }

  void _initSocket() {
    _socket?.disconnect();
    _socket?.destroy();

    final String baseUrl = dotenv.env['API_BASE_URL'] ?? 'http://localhost:3000';
    // Strip '/api' prefix from baseUrl if present
    final String socketUrl = baseUrl.replaceAll('/api', '');

    _socket = IO.io(socketUrl, IO.OptionBuilder()
      .setTransports(['websocket'])
      .enableAutoConnect()
      .build());

    _socket!.onConnect((_) {
      _isConnected = true;
      debugPrint('Conectado al servidor de WebSockets');
      // Solicitar los trackings actuales al reconectarse
      _socket!.emit('getTrackings');
    });

    _socket!.onDisconnect((_) {
      _isConnected = false;
      debugPrint('Desconectado del servidor de WebSockets');
    });

    _socket!.on('trackings', (data) {
      try {
        if (data is List) {
          _activeTrackings.clear();
          for (var item in data) {
            _activeTrackings.add(Map<String, dynamic>.from(item as Map));
          }
          _trackingsController.add(List.from(_activeTrackings));
        }
      } catch (e) {
        debugPrint('Error parseando trackings en WebSockets: $e');
      }
    });

    _socket!.on('tracking_started', (data) {
      try {
        if (data is Map) {
          final newTracking = Map<String, dynamic>.from(data);
          final index = _activeTrackings.indexWhere((t) => t['id'] == newTracking['id']);
          if (index != -1) {
            _activeTrackings[index] = newTracking;
          } else {
            _activeTrackings.add(newTracking);
          }
          _trackingsController.add(List.from(_activeTrackings));
        }
      } catch (e) {
        debugPrint('Error parseando tracking_started en WebSockets: $e');
      }
    });

    _socket!.on('tracking_stopped', (data) {
      try {
        if (data is Map) {
          final userId = data['userId'] as String?;
          if (userId != null) {
            _activeTrackings.removeWhere((t) => t['id'] == userId);
            _trackingsController.add(List.from(_activeTrackings));
          }
        }
      } catch (e) {
        debugPrint('Error parseando tracking_stopped en WebSockets: $e');
      }
    });
  }

  /// Crea o actualiza un documento de tracking en tiempo real.
  /// [trackingId] es el ID de usuario o un ID único por vehículo.
  /// [data] contiene latitud, longitud, tipo de vehículo y la ruta.
  Future<void> startTracking(String trackingId, Map<String, dynamic> data) async {
    try {
      _socket?.emit('startTracking', {
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
      _socket?.emit('stopTracking', {
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
    if (_socket != null && _socket!.connected) {
      _socket!.emit('getTrackings');
    }
    return _trackingsController.stream;
  }

  void disconnect() {
    _socket?.disconnect();
    _socket = null;
    _isConnected = false;
    debugPrint('Conexión de WebSockets de Tracking cerrada por sesión terminada.');
  }
}
