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
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              color: const Color(0xFF30302E).withValues(alpha: 0.94),
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.3),
                  blurRadius: 8,
                  spreadRadius: 1,
                  offset: const Offset(0, 4),
                ),
              ],
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
                const SizedBox(height: 10),
                ClipRRect(
                  borderRadius: BorderRadius.circular(999),
                  child: const SizedBox(
                    height: 12,
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Expanded(child: ColoredBox(color: Color(0xFF22C55E))),
                        Expanded(child: ColoredBox(color: Color(0xFF84CC16))),
                        Expanded(child: ColoredBox(color: Color(0xFFEAB308))),
                        Expanded(child: ColoredBox(color: Color(0xFFF97316))),
                        Expanded(child: ColoredBox(color: Color(0xFFEF4444))),
                      ],
                    ),
                  ),
                ),
                if (riskIndex != null) ...[
                  const SizedBox(height: 2),
                  SizedBox(
                    height: 14,
                    child: Align(
                      alignment: Alignment(-1.0 + 2.0 * riskIndex.clamp(0.0, 1.0), 0.0),
                      child: const Icon(
                        Icons.arrow_drop_up_rounded,
                        color: Color(0xFF94A3B8),
                        size: 24,
                      ),
                    ),
                  ),
                ] else
                  const SizedBox(height: 4),
                const Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Bajo', style: TextStyle(color: Colors.white60, fontSize: 10, fontWeight: FontWeight.w600)),
                    Text('Alto', style: TextStyle(color: Colors.white60, fontSize: 10, fontWeight: FontWeight.w600)),
                  ],
                ),
                const SizedBox(height: 12),
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
                              ? const Color(0xFF3C8C6E)
                              : Colors.white.withValues(alpha: 0.06),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(
                            color: provider.enabled
                                ? const Color(0xFF3C8C6E)
                                : Colors.white.withValues(alpha: 0.25),
                            width: 1.5,
                          ),
                        ),
                        child: provider.enabled
                            ? const Icon(Icons.check_rounded, size: 14, color: Colors.white)
                            : null,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        provider.enabled ? 'Zonas activas' : 'Zonas desactivadas',
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
