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
    switch (type.toUpperCase()) {
      case 'ROBO': return Colors.red;
      case 'INCENDIO': return Colors.orange;
      case 'ACCIDENTE': return Colors.blue;
      default: return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    final color = _alertColor(alert.type);
    final dateLabel = alert.createdAt != null
        ? '${alert.createdAt!.day}/${alert.createdAt!.month}/${alert.createdAt!.year}'
        : 'Sin fecha';

    final isAuthority = context.read<AuthProvider>().user?.roleId == 2;
    final incidentLocation = _toLatLng(alert.coordinates);

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: alert.verified
            ? const BorderSide(color: Colors.green, width: 2)
            : BorderSide.none,
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.warning, color: color, size: 20),
                const SizedBox(width: 8),
                Text(alert.type.toUpperCase(), style: TextStyle(color: color, fontWeight: FontWeight.bold)),
                const Spacer(),
                if (alert.verified)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: Colors.green.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.verified, color: Colors.green, size: 14),
                        SizedBox(width: 4),
                        Text('Verificado', style: TextStyle(color: Colors.green, fontSize: 11, fontWeight: FontWeight.w600)),
                      ],
                    ),
                  ),
                if (!alert.verified)
                  Text(dateLabel, style: const TextStyle(color: Colors.grey, fontSize: 12)),
              ],
            ),
            if (alert.verified)
              Padding(
                padding: const EdgeInsets.only(top: 2),
                child: Align(
                  alignment: Alignment.centerRight,
                  child: Text(dateLabel, style: const TextStyle(color: Colors.grey, fontSize: 11)),
                ),
              ),
            const SizedBox(height: 8),
            Text(alert.description),
            const SizedBox(height: 8),
            if (alert.images.isNotEmpty)
              SizedBox(
                height: 150,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  itemCount: alert.images.length,
                  itemBuilder: (context, index) {
                    final imageUrl = alert.images[index].url;
                    return Padding(
                      padding: const EdgeInsets.only(right: 8.0),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: Image.network(
                          imageUrl,
                          height: 150,
                          width: 150,
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) =>
                              Container(
                                height: 150,
                                width: 150,
                                color: Colors.grey[800],
                                child: const Icon(Icons.broken_image, color: Colors.white54),
                              ),
                        ),
                      ),
                    );
                  },
                ),
              ),
            if (isAuthority && incidentLocation != null) ...[
              const Divider(),
              SizedBox(
                width: double.infinity,
                child: TextButton.icon(
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
                  icon: const Icon(Icons.map),
                  label: const Text('VER RUTA'),
                ),
              ),
            ]
          ],
        ),
      ),
    );
  }
}
