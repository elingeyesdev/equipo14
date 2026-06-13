import 'package:flutter/material.dart';
import 'package:app_alertas/core/facility_utils.dart';
import 'package:app_alertas/models/facility_model.dart';

class FacilitiesOverlay extends StatefulWidget {
  final List<FacilityModel> nearestFacilities;
  final String? profileType;
  final ValueChanged<FacilityModel>? onFacilityTap;

  const FacilitiesOverlay({
    super.key,
    required this.nearestFacilities,
    this.profileType,
    this.onFacilityTap,
  });

  @override
  State<FacilitiesOverlay> createState() => _FacilitiesOverlayState();
}

class _FacilitiesOverlayState extends State<FacilitiesOverlay> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    if (widget.nearestFacilities.isEmpty) {
      return const SizedBox.shrink();
    }

    return ConstrainedBox(
      constraints: BoxConstraints(maxWidth: MediaQuery.sizeOf(context).width - 24),
      child: Material(
        color: const Color(0xFF30302E).withValues(alpha: 0.94),
        borderRadius: BorderRadius.circular(16),
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
                            ? 'Instalaciones cercanas · ${facilityTypeLabel(widget.profileType!)}'
                            : 'Instalaciones de emergencia cercanas',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                    Icon(
                      _expanded ? Icons.expand_less : Icons.expand_more,
                      color: Colors.white70,
                      size: 20,
                    ),
                  ],
                ),
                if (_expanded) ...[
                  const SizedBox(height: 10),
                  ...widget.nearestFacilities.take(5).map((facility) {
                    final distanceKm = (facility.distanceMeters ?? 0) / 1000;
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Material(
                        color: Colors.transparent,
                        child: InkWell(
                          borderRadius: BorderRadius.circular(10),
                          onTap: widget.onFacilityTap != null
                              ? () => widget.onFacilityTap!(facility)
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
                                    color: facilityTypeColor(facility.type)
                                        .withValues(alpha: 0.2),
                                    shape: BoxShape.circle,
                                  ),
                                  child: Icon(
                                    facilityTypeIcon(facility.type),
                                    color: facilityTypeColor(facility.type),
                                    size: 16,
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        facility.name,
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 12,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                      Text(
                                        '${facilityTypeLabel(facility.type)} · ${distanceKm.toStringAsFixed(1)} km · Toca para ruta',
                                        style: const TextStyle(
                                          color: Colors.white60,
                                          fontSize: 10,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                if (widget.onFacilityTap != null)
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
    );
  }
}
