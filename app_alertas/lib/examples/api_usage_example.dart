import 'package:flutter/foundation.dart';

import '../config/api_config.dart';
import '../services/api_service.dart';

/// Ejemplo mínimo para probar listado y alta desde consola / depuración.
///
/// Uso (por ejemplo en un `FloatingActionButton` temporal o en `main`):
/// ```dart
/// await ApiUsageExample.mostrarReportesEnConsola();
/// ```
class ApiUsageExample {
  static Future<void> mostrarReportesEnConsola() async {
    final api = ApiService();
    try {
      final lista = await api.obtenerReportes();
      debugPrint('Reportes: ${lista.length}');
      for (final r in lista) {
        debugPrint(
          '#${r.id} ${r.type} — ${r.description} — ${r.coordinates}',
        );
      }
    } catch (e, st) {
      debugPrint('Error listando: $e\n$st');
    }
  }

  static Future<void> crearUsuarioDePruebaEnConsola() async {
    final api = ApiService();
    try {
      final u = await api.crearUsuario(
        firstName: 'prueba',
        lastName: 'flutter',
        phone: '12345678',
        password: 'secreto1',
      );
      debugPrint('Usuario creado id=${u.id} — copia este UUID a ApiConfig.defaultUserId');
    } catch (e) {
      debugPrint('Error creando usuario (¿teléfono duplicado?): $e');
    }
  }

  static Future<void> crearReporteDePruebaEnConsola() async {
    final api = ApiService();
    if (ApiConfig.defaultUserId.contains('00000000')) {
      debugPrint('Configura ApiConfig.defaultUserId con un UUID real antes de crear reportes.');
      return;
    }
    try {
      final r = await api.crearReporte(
        type: 'robo',
        description: 'Prueba desde Flutter',
        userId: ApiConfig.defaultUserId,
        latitude: -17.7833,
        longitude: -63.1821,
      );
      debugPrint('Reporte creado id=${r.id} coords=${r.coordinates}');
    } catch (e) {
      debugPrint('Error: $e');
    }
  }
}
