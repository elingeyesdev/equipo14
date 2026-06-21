import 'package:flutter/material.dart';
import 'package:app_alertas/core/emergency_station_utils.dart';
import 'package:app_alertas/models/emergency_station_model.dart';

class EmergencyStationsOverlay extends StatefulWidget {
  final List<EmergencyStationModel> nearestEmergencyStations;
  final String? profileType;
  final ValueChanged<EmergencyStationModel>? onStationTap;

  const EmergencyStationsOverlay({
    super.key,
    required this.nearestEmergencyStations,
    this.profileType,
    this.onStationTap,
  });

  @override
  State<EmergencyStationsOverlay> createState() => _EmergencyStationsOverlayState();
}

class _EmergencyStationsOverlayState extends State<EmergencyStationsOverlay> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    if (widget.nearestEmergencyStations.isEmpty) {
      return const SizedBox.shrink();
    }

    return ConstrainedBox(
      constraints: BoxConstraints(maxWidth: MediaQuery.sizeOf(context).width - 24),
      child: Container(
        decoration: BoxDecoration(
          color: Theme.of(context).cardTheme.color?.withValues(alpha: 0.94) ?? const Color(0xFF30302E).withValues(alpha: 0.94),
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: Theme.of(context).brightness == Brightness.dark ? 0.3 : 0.08),
              blurRadius: 8,
              spreadRadius: 1,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            borderRadius: BorderRadius.circular(16),
            onTap: () => setState(() => _expanded = !_expanded),
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.emergency_rounded, color: Color(0xFFAF6D58), size: 18),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          widget.profileType != null
                              ? 'Instalaciones cercanas · ${emergencyStationTypeLabel(widget.profileType!)}'
                              : 'Estaciones de emergencia cercanas',
                          style: TextStyle(
                            color: Theme.of(context).colorScheme.onSurface,
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                      Icon(
                        _expanded ? Icons.expand_less : Icons.expand_more,
                        color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.7),
                        size: 20,
                      ),
                    ],
                  ),
                  if (_expanded) ...[
                    const SizedBox(height: 10),
                    ...widget.nearestEmergencyStations.take(5).map((station) {
                      final distanceKm = (station.distanceMeters ?? 0) / 1000;
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: Material(
                          color: Colors.transparent,
                          child: InkWell(
                            borderRadius: BorderRadius.circular(10),
                            onTap: widget.onStationTap != null
                                ? () => widget.onStationTap!(station)
                                : null,
                            child: Padding(
                              padding: const EdgeInsets.symmetric(vertical: 4),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Container(
                                    width: 28,
                                    height: 28,
                                    decoration: BoxDecoration(
                                      color: emergencyStationTypeColor(station.installationType)
                                          .withValues(alpha: 0.2),
                                      shape: BoxShape.circle,
                                    ),
                                    child: Icon(
                                      emergencyStationTypeIcon(station.installationType),
                                      color: emergencyStationTypeColor(station.installationType),
                                      size: 16,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          station.name,
                                          style: TextStyle(
                                            color: Theme.of(context).colorScheme.onSurface,
                                            fontSize: 12,
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                        Text(
                                          '${emergencyStationTypeLabel(station.installationType)} · ${distanceKm.toStringAsFixed(1)} km · Toca para ruta',
                                          style: TextStyle(
                                            color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6),
                                            fontSize: 10,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  if (widget.onStationTap != null)
                                    const Icon(
                                      Icons.directions_rounded,
                                      color: Color(0xFFAF6D58),
                                      size: 18,
                                    ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      );
                    }),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
