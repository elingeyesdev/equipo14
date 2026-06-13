import 'package:app_alertas/models/alert_model.dart';

/// Reportes sin actividad reciente no se muestran en el mapa.
const reportMapStaleDuration = Duration(hours: 2);

DateTime alertLastActivityAt(AlertModel alert) {
  final created = alert.createdAt ?? DateTime.fromMillisecondsSinceEpoch(0);
  final updated = alert.updatedAt ?? created;
  if (updated.isAfter(created)) return updated;
  return created;
}

bool isAlertVisibleOnMap(AlertModel alert, {DateTime? now}) {
  final reference = now ?? DateTime.now();
  final lastActivity = alertLastActivityAt(alert);
  return reference.difference(lastActivity) <= reportMapStaleDuration;
}

List<AlertModel> filterAlertsForMap(List<AlertModel> alerts) {
  return alerts.where(isAlertVisibleOnMap).toList();
}
