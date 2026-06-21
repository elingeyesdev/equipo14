import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:socket_io_client/socket_io_client.dart' as socket_io;
import 'package:app_alertas/models/alert_model.dart';

class ReportsSocketService {
  late socket_io.Socket _socket;
  final _reportsController = StreamController<AlertModel>.broadcast();

  ReportsSocketService() {
    _initSocket();
  }

  void _initSocket() {
    final String baseUrl = dotenv.env['API_BASE_URL'] ?? 'http://localhost:3000';
    // Strip '/api' suffix and add '/reports' namespace
    final String socketUrl = '${baseUrl.replaceAll('/api', '')}/reports';

    _socket = socket_io.io(socketUrl, socket_io.OptionBuilder()
      .setTransports(['websocket'])
      .enableAutoConnect()
      .build());

    _socket.onConnect((_) {
      debugPrint('Conectado al servidor de WebSockets de Reportes');
    });

    _socket.onDisconnect((_) {
      debugPrint('Desconectado del servidor de WebSockets de Reportes');
    });

    _socket.on('newReport', (data) {
      try {
        if (data != null && data is Map) {
          final alert = AlertModel.fromJson(Map<String, dynamic>.from(data));
          _reportsController.add(alert);
        }
      } catch (e) {
        debugPrint('Error parseando nuevo reporte desde WebSockets: $e');
      }
    });
  }

  /// Escucha eventos de nuevos reportes creados.
  Stream<AlertModel> streamNewReports() {
    return _reportsController.stream;
  }

  void dispose() {
    _socket.disconnect();
    _reportsController.close();
  }
}
