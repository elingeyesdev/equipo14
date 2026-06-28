import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:app_alertas/core/risk_zones.dart';
import 'package:app_alertas/viewmodels/risk_zone_provider.dart';

class RiskZoneOverlay extends StatefulWidget {
  const RiskZoneOverlay({super.key});

  @override
  State<RiskZoneOverlay> createState() => _RiskZoneOverlayState();
}

class _RiskZoneOverlayState extends State<RiskZoneOverlay> with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 14), // Velocidad lenta y suave para el HUD
    );
    _animation = Tween<double>(begin: 0.0, end: 1.0).animate(_controller);
    _controller.repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<RiskZoneProvider>(
      builder: (context, provider, _) {
        if (!provider.loaded) return const SizedBox.shrink();

        final riskIndex = provider.currentRiskIndex ?? 0.0;
        final pct = (riskIndex * 100).round();
        final color = riskIndexToColor(riskIndex);

        return Material(
          color: Colors.transparent,
          child: Container(
            height: 36,
            decoration: BoxDecoration(
              color: const Color(0xFF15171E).withValues(alpha: 0.75),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.3),
                  blurRadius: 8,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: ClipRect(
              child: BackdropFilter(
                filter: ui.ImageFilter.blur(sigmaX: 8.0, sigmaY: 8.0),
                child: AnimatedBuilder(
                  animation: _animation,
                  builder: (context, child) {
                    return CustomPaint(
                      painter: TickerPainter(
                        scrollValue: _animation.value,
                        percentage: pct,
                        color: color,
                      ),
                      child: const SizedBox.expand(),
                    );
                  },
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

class TickerPainter extends CustomPainter {
  final double scrollValue; // 0.0 a 1.0
  final int percentage;
  final Color color;

  TickerPainter({
    required this.scrollValue,
    required this.percentage,
    required this.color,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 1.8
      ..style = PaintingStyle.stroke;

    final textPaint = TextPainter(
      textDirection: TextDirection.ltr,
    );

    // Formatear porcentaje a 3 dígitos (ej. 066) con estilo cyber/HUD
    final pctText = percentage.toString().padLeft(3, '0');
    final textStyle = TextStyle(
      color: color,
      fontSize: 15,
      fontWeight: FontWeight.w900,
      fontFamily: 'monospace',
      letterSpacing: 1.5,
    );

    textPaint.text = TextSpan(text: pctText, style: textStyle);
    textPaint.layout();
    final textWidth = textPaint.width;
    final textHeight = textPaint.height;

    // Intervalo de repetición del patrón
    const double interval = 280.0;

    // Desplazamiento horizontal continuo (de derecha a izquierda)
    final double dx = -scrollValue * interval;

    final double yCenter = size.height / 2;
    final double y1 = yCenter - 3;
    final double y2 = yCenter + 3;

    double x = -interval + (dx % interval);
    while (x < size.width + interval) {
      // 1. Pintar el texto del porcentaje
      final textOffset = Offset(x - textWidth / 2, yCenter - textHeight / 2);
      textPaint.paint(canvas, textOffset);

      // 2. Pintar el separador "=" a la izquierda del texto
      final double leftBarStart = x - textWidth / 2 - 18;
      final double leftBarEnd = x - textWidth / 2 - 6;
      canvas.drawLine(Offset(leftBarStart, y1), Offset(leftBarEnd, y1), paint);
      canvas.drawLine(Offset(leftBarStart, y2), Offset(leftBarEnd, y2), paint);

      // 3. Pintar las líneas paralelas a la derecha del texto
      final double lineStart = x + textWidth / 2 + 8;
      final double lineEnd = (x + interval) - textWidth / 2 - 18;

      canvas.drawLine(Offset(lineStart, y1), Offset(lineEnd, y1), paint);
      canvas.drawLine(Offset(lineStart, y2), Offset(lineEnd, y2), paint);

      // 4. Pintar marcas decorativas en diagonal "////" cerca del final de la línea
      final double slashStart = lineEnd - 35;
      final slashPaint = Paint()
        ..color = color.withValues(alpha: 0.85)
        ..strokeWidth = 2.0
        ..style = PaintingStyle.stroke;

      for (int i = 0; i < 4; i++) {
        final double sx = slashStart + i * 5;
        canvas.drawLine(
          Offset(sx, yCenter - 5),
          Offset(sx + 3, yCenter + 5),
          slashPaint,
        );
      }

      // 5. Pintar marcas decorativas verticales "||" cerca del inicio de la línea
      final double patternStart = lineStart + 12;
      for (int i = 0; i < 2; i++) {
        final double px = patternStart + i * 4;
        canvas.drawLine(
          Offset(px, yCenter - 4),
          Offset(px, yCenter + 4),
          slashPaint,
        );
      }

      x += interval;
    }
  }

  @override
  bool shouldRepaint(covariant TickerPainter oldDelegate) {
    return oldDelegate.scrollValue != scrollValue ||
        oldDelegate.percentage != percentage ||
        oldDelegate.color != color;
  }
}
