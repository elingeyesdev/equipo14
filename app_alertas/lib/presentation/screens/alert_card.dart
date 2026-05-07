import 'package:flutter/material.dart';
import 'package:app_alertas/data/models/alert_model.dart';
import 'package:app_alertas/presentation/screens/map_route_screen.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';
import 'package:app_alertas/presentation/providers/auth_provider.dart';

class AlertCard extends StatelessWidget {
  final AlertModel alert;

  const AlertCard({super.key, required this.alert});

  LatLng? _toLatLng(List<double> coordinates) {
    if (coordinates.length < 2) return null;
    return LatLng(coordinates[1], coordinates[0]);
  }

  Color _alertColor(String type) {
    final t = type.toUpperCase();
    if (t.contains('ROBO') || t.contains('HURTO')) return const Color(0xFFEF4444);
    if (t.contains('INCENDIO')) return const Color(0xFFF59E0B);
    if (t.contains('ACCIDENTE') || t.contains('VIAL')) return const Color(0xFF3B82F6);
    if (t.contains('MÉDICA') || t.contains('SALUD')) return const Color(0xFF10B981);
    return const Color(0xFF8B5CF6);
  }

  IconData _alertIcon(String type) {
    final t = type.toUpperCase();
    if (t.contains('ROBO')) return Icons.security_rounded;
    if (t.contains('HURTO')) return Icons.person_off_rounded;
    if (t.contains('INCENDIO')) return Icons.local_fire_department_rounded;
    if (t.contains('ACCIDENTE')) return Icons.car_crash_rounded;
    if (t.contains('VIAL')) return Icons.traffic_rounded;
    if (t.contains('MÉDICA')) return Icons.medical_services_rounded;
    return Icons.warning_amber_rounded;
  }

  @override
  Widget build(BuildContext context) {
    final color = _alertColor(alert.type);
    final dateLabel = alert.createdAt != null
        ? '${alert.createdAt!.day}/${alert.createdAt!.month} ${alert.createdAt!.hour}:${alert.createdAt!.minute.toString().padLeft(2, '0')}'
        : 'Reciente';

    final isAuthority = context.read<AuthProvider>().user?.roleId == 2;
    final incidentLocation = _toLatLng(alert.coordinates);

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(20),
        border: alert.verified
            ? Border.all(color: Colors.green.withValues(alpha: 0.5), width: 1.5)
            : Border.all(color: Colors.white.withValues(alpha: 0.05), width: 1),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.2),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header con Color y Tipo
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [color.withValues(alpha: 0.2), color.withValues(alpha: 0.05)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: color.withValues(alpha: 0.2),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(_alertIcon(alert.type), color: color, size: 20),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      alert.type.toUpperCase(),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: color,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 1.2,
                        fontSize: 13,
                      ),
                    ),
                  ),
                  const Spacer(),
                  if (alert.verified)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.green.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.verified, color: Colors.green, size: 14),
                          SizedBox(width: 4),
                          Text('VERIFICADO', style: TextStyle(color: Colors.green, fontSize: 10, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                ],
              ),
            ),
            
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          alert.zone ?? 'Zona no especificada',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                      Text(
                        dateLabel,
                        style: const TextStyle(color: Colors.grey, fontSize: 12),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    alert.description,
                    style: const TextStyle(color: Colors.white70, fontSize: 14, height: 1.4),
                  ),
                  
                  if (alert.weight > 0) ...[
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.blue.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.people_alt_rounded, size: 14, color: Colors.blue),
                          const SizedBox(width: 6),
                          Text(
                            '${alert.weight.toInt()} confirmaciones',
                            style: const TextStyle(color: Colors.blue, fontSize: 12, fontWeight: FontWeight.w600),
                          ),
                        ],
                      ),
                    ),
                  ],
                  
                  if (alert.images.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    SizedBox(
                      height: 120,
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        itemCount: alert.images.length,
                        itemBuilder: (context, index) {
                          final imageUrl = alert.images[index].url;
                          return Container(
                            margin: const EdgeInsets.only(right: 10),
                            width: 120,
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
                            ),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(12),
                              child: Image.network(
                                imageUrl,
                                fit: BoxFit.cover,
                                errorBuilder: (context, error, stackTrace) =>
                                    const Icon(Icons.broken_image, color: Colors.grey),
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                  
                  if (isAuthority && incidentLocation != null) ...[
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.blueAccent,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          elevation: 0,
                        ),
                        onPressed: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) => MapRouteScreen(
                                latitude: incidentLocation.latitude,
                                longitude: incidentLocation.longitude,
                                description: alert.description,
                                type: alert.type,
                              ),
                            ),
                          );
                        },
                        icon: const Icon(Icons.directions_rounded),
                        label: const Text('TRAZAR RUTA', style: TextStyle(fontWeight: FontWeight.bold)),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
