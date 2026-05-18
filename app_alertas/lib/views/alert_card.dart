import 'package:flutter/material.dart';
import 'package:app_alertas/models/alert_model.dart';
import 'package:app_alertas/views/map_route_screen.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';
import 'package:app_alertas/viewmodels/auth_viewmodel.dart';

class AlertCard extends StatefulWidget {
  final AlertModel alert;
  final VoidCallback? onTap;
  final VoidCallback? onVerify;
  final bool isInBottomSheet;

  const AlertCard({
    super.key,
    required this.alert,
    this.onTap,
    this.onVerify,
    this.isInBottomSheet = false,
  });

  @override
  State<AlertCard> createState() => _AlertCardState();
}

class _AlertCardState extends State<AlertCard> {
  int _currentImageIndex = 0;

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

  String _timeAgo(DateTime? dateTime) {
    if (dateTime == null) return 'Reciente';
    final difference = DateTime.now().toUtc().difference(dateTime.toUtc());
    if (difference.inSeconds < 60) {
      return 'Hace un momento';
    } else if (difference.inMinutes < 60) {
      return 'Hace ${difference.inMinutes} min';
    } else if (difference.inHours < 24) {
      return 'Hace ${difference.inHours} hr';
    } else {
      return '${dateTime.day}/${dateTime.month}';
    }
  }

  @override
  Widget build(BuildContext context) {
    final color = _alertColor(widget.alert.type);
    final isAuthority = context.read<AuthViewModel>().user?.roleId == 2;
    final incidentLocation = _toLatLng(widget.alert.coordinates);
    final timeLabel = _timeAgo(widget.alert.createdAt);

    // Contribuciones: tamaño de la lista de imágenes menos 1 (la del creador)
    final contributions = widget.alert.images.isEmpty ? 0 : widget.alert.images.length - 1;

    return InkWell(
      onTap: widget.onTap,
      splashColor: Colors.white.withValues(alpha: 0.03),
      highlightColor: Colors.transparent,
      child: Container(
        margin: EdgeInsets.only(bottom: widget.isInBottomSheet ? 0 : 28),
        decoration: const BoxDecoration(
          color: Colors.transparent, // Seamless integration with the list background
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 1. Header con el indicador de tipo de incidente (badge)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: color.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: color.withValues(alpha: 0.25), width: 1),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(_alertIcon(widget.alert.type), color: color, size: 13),
                        const SizedBox(width: 6),
                        Text(
                          widget.alert.type.toUpperCase(),
                          style: TextStyle(
                            color: color,
                            fontWeight: FontWeight.w800,
                            fontSize: 10,
                            letterSpacing: 0.5,
                        ),
                      ),
                    ],
                  ),
                ),
                const Spacer(),
                if (widget.alert.verified)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.green.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Row(
                      children: [
                        Icon(Icons.verified, color: Colors.green, size: 13),
                        SizedBox(width: 4),
                        Text(
                          'VERIFICADO',
                          style: TextStyle(
                            color: Colors.green,
                            fontSize: 9,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ),

          // 2. Metadata: Tiempo y contribuciones (ej: "Hace un momento · Contribuciones: 2")
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Text(
              '$timeLabel · Contribuciones: $contributions',
              style: const TextStyle(
                color: Color(0xFFF59E0B), // Yellow/amber accent
                fontWeight: FontWeight.bold,
                fontSize: 12,
              ),
            ),
          ),

          const SizedBox(height: 4),

          // 3. Título / Zona de la alerta
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Text(
              widget.alert.zone ?? 'Zona no especificada',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
                letterSpacing: -0.3,
              ),
            ),
          ),

          const SizedBox(height: 12),

          // 4. Carrusel de imágenes interactivo (sin bordes redondeados y a lo ancho de la pantalla)
          if (widget.alert.images.isNotEmpty)
            Container(
              height: 250,
              width: double.infinity,
              color: Colors.black.withValues(alpha: 0.2),
              child: Stack(
                children: [
                  PageView.builder(
                    itemCount: widget.alert.images.length,
                    onPageChanged: (index) {
                      setState(() {
                        _currentImageIndex = index;
                      });
                    },
                    itemBuilder: (context, index) {
                      final imageUrl = widget.alert.images[index];
                      return Image.network(
                        imageUrl,
                        width: double.infinity,
                        height: 250,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) => Container(
                          color: Colors.white.withValues(alpha: 0.05),
                          child: const Center(
                            child: Icon(Icons.broken_image, color: Colors.grey, size: 40),
                          ),
                        ),
                      );
                    },
                  ),
                  // Indicador elegante en la esquina superior derecha: e.g. "1 / 3"
                  if (widget.alert.images.length > 1)
                    Positioned(
                      top: 12,
                      right: 12,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.65),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: Colors.white.withValues(alpha: 0.15), width: 1),
                        ),
                        child: Text(
                          '${_currentImageIndex + 1} / ${widget.alert.images.length}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),

          const SizedBox(height: 12),

          // 5. Descripción del incidente
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Text(
              widget.alert.description,
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.75),
                fontSize: 14,
                height: 1.5,
              ),
            ),
          ),

          // 6. Botón de trazar ruta para autoridades
          if (isAuthority && incidentLocation != null)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              child: SizedBox(
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
                          description: widget.alert.description,
                          type: widget.alert.type,
                        ),
                      ),
                    );
                  },
                  icon: const Icon(Icons.directions_rounded),
                  label: const Text('TRAZAR RUTA', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
            ),

          // 7. Botón de verificar incidente para autoridades
          if (isAuthority && !widget.alert.verified && widget.onVerify != null)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green.withValues(alpha: 0.1),
                    foregroundColor: Colors.green,
                    elevation: 0,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                      side: BorderSide(color: Colors.green.withValues(alpha: 0.2)),
                    ),
                  ),
                  onPressed: widget.onVerify,
                  icon: const Icon(Icons.verified_outlined, size: 18),
                  label: const Text('VERIFICAR ESTE INCIDENTE', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                ),
              ),
            ),
            
            if (!widget.isInBottomSheet) ...[
              const SizedBox(height: 28),
              // Divisor elegante entre publicaciones
              Divider(
                height: 1,
                thickness: 1,
                color: Colors.white.withValues(alpha: 0.05),
              ),
            ] else
              const SizedBox(height: 28),
          ],
        ),
      ),
    );
  }
}
