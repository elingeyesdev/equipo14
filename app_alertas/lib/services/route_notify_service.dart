import 'package:app_alertas/core/network/dio_client.dart';
import 'package:latlong2/latlong.dart';

class RouteNotifyService {
  DateTime? _lastNotifyAt;

  Future<void> notifyUsersAlongRoute({
    required List<LatLng> route,
    String? incidentType,
    String? description,
    int? reportId,
  }) async {
    if (route.length < 2) return;

    final now = DateTime.now();
    if (_lastNotifyAt != null &&
        now.difference(_lastNotifyAt!) < const Duration(seconds: 60)) {
      return;
    }
    _lastNotifyAt = now;

    try {
      await dioClient.dio.post(
        '/trackings/notify-route',
        data: {
          'route': route
              .map((p) => {'lat': p.latitude, 'lng': p.longitude})
              .toList(),
          if (incidentType != null) 'incidentType': incidentType,
          if (description != null) 'description': description,
          if (reportId != null) 'reportId': reportId,
        },
      );
    } catch (_) {
      // No bloquear tracking si falla la notificación push.
    }
  }
}
