import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:app_alertas/core/risk_zones.dart';
import 'package:app_alertas/viewmodels/risk_zone_provider.dart';

class RiskZoneOverlay extends StatelessWidget {
  const RiskZoneOverlay({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<RiskZoneProvider>(
      builder: (context, provider, _) {
        if (!provider.loaded) return const SizedBox.shrink();

        final riskIndex = provider.currentRiskIndex;
        final pct = riskIndex != null ? (riskIndex * 100).round() : null;
        final level = riskIndex != null ? riskLevelLabel(riskIndex) : null;

        return Material(
          color: Colors.transparent,
          child: Container(
            width: 172,
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: const Color(0xFF30302E).withValues(alpha: 0.94),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  pct != null ? 'Riesgo · $pct% ($level)' : 'Zonas de riesgo',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                if (provider.currentZone?.name case final name?) ...[
                  const SizedBox(height: 2),
                  Text(
                    name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.65),
                      fontSize: 9,
                    ),
                  ),
                ],
                const SizedBox(height: 8),
                ClipRRect(
                  borderRadius: BorderRadius.circular(999),
                  child: const SizedBox(
                    height: 6,
                    child: Row(
                      children: [
                        Expanded(child: ColoredBox(color: Color(0xFF22C55E))),
                        Expanded(child: ColoredBox(color: Color(0xFFEAB308))),
                        Expanded(child: ColoredBox(color: Color(0xFFEF4444))),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 4),
                const Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Bajo', style: TextStyle(color: Color(0xFF22C55E), fontSize: 8)),
                    Text('Medio', style: TextStyle(color: Color(0xFFEAB308), fontSize: 8)),
                    Text('Alto', style: TextStyle(color: Color(0xFFEF4444), fontSize: 8)),
                  ],
                ),
                if (riskIndex != null) ...[
                  const SizedBox(height: 4),
                  Align(
                    alignment: Alignment(-1 + 2 * riskIndex.clamp(0.0, 1.0), 0),
                    child: Container(
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(
                        color: riskIndexToColor(riskIndex),
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 1.5),
                      ),
                    ),
                  ),
                ],
                const SizedBox(height: 10),
                GestureDetector(
                  onTap: () => provider.setEnabled(!provider.enabled),
                  child: Row(
                    children: [
                      AnimatedContainer(
                        duration: const Duration(milliseconds: 180),
                        width: 22,
                        height: 22,
                        decoration: BoxDecoration(
                          color: provider.enabled
                              ? const Color(0xFF22C55E).withValues(alpha: 0.25)
                              : Colors.white.withValues(alpha: 0.06),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(
                            color: provider.enabled
                                ? const Color(0xFF22C55E)
                                : Colors.white.withValues(alpha: 0.25),
                            width: 1.5,
                          ),
                        ),
                        child: provider.enabled
                            ? const Icon(Icons.check_rounded, size: 14, color: Color(0xFF22C55E))
                            : null,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        provider.enabled ? 'Zonas activas' : 'Zonas off',
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.85),
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
