import 'package:flutter/material.dart';
import 'package:app_alertas/models/alert_model.dart';
import 'package:provider/provider.dart';
import 'package:app_alertas/viewmodels/auth_viewmodel.dart';
import 'package:app_alertas/views/comments_screen.dart';

class AlertCard extends StatefulWidget {
  final AlertModel alert;
  final VoidCallback? onTap;
  final VoidCallback? onVerify;
  final bool isInBottomSheet;
  final VoidCallback? onContribute;

  const AlertCard({
    super.key,
    required this.alert,
    this.onTap,
    this.onVerify,
    this.isInBottomSheet = false,
    this.onContribute,
  });

  @override
  State<AlertCard> createState() => _AlertCardState();
}

class _AlertCardState extends State<AlertCard> {
  int _currentImageIndex = 0;
  double _aspectRatio = 1.0;

  @override
  void initState() {
    super.initState();
    if (widget.alert.images.isNotEmpty) {
      _calculateAspectRatio();
    }
  }

  void _calculateAspectRatio() {
    final image = Image.network(widget.alert.images.first);
    image.image.resolve(const ImageConfiguration()).addListener(
      ImageStreamListener(
        (info, _) {
          if (mounted) {
            setState(() {
              double ratio = info.image.width / info.image.height;
              if (ratio < 0.8) ratio = 0.8; // 4:5 vertical
              if (ratio > 1.91) ratio = 1.91; // 1.91:1 horizontal
              _aspectRatio = ratio;
            });
          }
        },
        onError: (exception, stackTrace) {
           // Fallback is already 1.0
        },
      ),
    );
  }



  Color _alertColor(String type) {
    final t = type.toUpperCase();
    if (t.contains('ROBO') || t.contains('HURTO')) return const Color(0xFFB64D4C);
    if (t.contains('INCENDIO')) return const Color(0xFFAA5F3C);
    if (t.contains('ACCIDENTE') || t.contains('VIAL')) return const Color(0xFF506E96);
    if (t.contains('MÉDICA') || t.contains('SALUD')) return const Color(0xFF3C8C6E);
    if (t.contains('VIOLENCIA') || t.contains('FAMILIAR')) return const Color(0xFF8B5CF6);
    if (t.contains('DISTURBIO')) return const Color(0xFFD97706);
    return const Color(0xFFAF6D58);
  }

  IconData _alertIcon(String type) {
    final t = type.toUpperCase();
    if (t.contains('ROBO') || t.contains('HURTO')) {
      if (t.contains('MENOR') || t.contains('HURTO')) {
        return Icons.directions_run_rounded;
      }
      return Icons.local_police_rounded;
    }
    if (t.contains('INCENDIO')) return Icons.local_fire_department_rounded;
    if (t.contains('ACCIDENTE')) return Icons.car_crash_rounded;
    if (t.contains('VIAL') || t.contains('OBSTRUCCIÓN')) {
      return Icons.construction_rounded;
    }
    if (t.contains('MÉDICA') || t.contains('SALUD')) {
      return Icons.medical_services_rounded;
    }
    if (t.contains('VIOLENCIA') || t.contains('FAMILIAR')) {
      return Icons.people_alt_rounded;
    }
    if (t.contains('DISTURBIO')) {
      return Icons.groups_rounded;
    }
    return Icons.warning_amber_rounded;
  }

  String _timeAgo(DateTime? dateTime) {
    if (dateTime == null) return 'Reciente';
    final difference = DateTime.now().toUtc().difference(dateTime.toUtc());
    if (difference.inSeconds < 60) {
      return 'Hace ${difference.inSeconds} segundos';
    } else if (difference.inMinutes < 60) {
      return 'Hace ${difference.inMinutes} minutos';
    } else if (difference.inHours < 24) {
      return 'Hace ${difference.inHours} horas';
    } else {
      return 'Hace ${difference.inDays} días';
    }
  }

  Widget _buildImageCarousel() {
    return Container(
      width: double.infinity,
      color: Colors.black, // Fondo negro para bordes vacíos
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
                fit: BoxFit.contain, // Escalado automático manteniendo el aspect ratio
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
    );
  }

  @override
  Widget build(BuildContext context) {
    final color = _alertColor(widget.alert.type);
    final isAuthority = context.read<AuthViewModel>().user?.roleId == 2;
    final onSurface = Theme.of(context).colorScheme.onSurface;

    // Contribuciones: tamaño de la lista de imágenes menos 1 (la del creador)
    final contributions = widget.alert.images.isEmpty ? 0 : widget.alert.images.length - 1;

    return Container(
      margin: EdgeInsets.zero,
      decoration: const BoxDecoration(
        color: Colors.transparent, // Seamless integration with the list background
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 1. Header con el indicador de tipo de incidente (badge)
          Padding(
            padding: const EdgeInsets.only(left: 16, right: 16, top: 12, bottom: 4),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: color,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(_alertIcon(widget.alert.type), color: Colors.white, size: 12),
                      const SizedBox(width: 6),
                      Text(
                        widget.alert.type.toUpperCase(),
                        style: const TextStyle(
                          color: Colors.white,
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
                      color: Color(0xFF3C8C6E),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Row(
                      children: [
                        Icon(Icons.verified, color: Color.fromARGB(255, 255, 255, 255), size: 13),
                        SizedBox(width: 4),
                        Text(
                          'VERIFICADO',
                          style: TextStyle(
                            color: Color.fromARGB(255, 255, 255, 255),
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

          // 3. Título / Zona de la alerta
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Text(
              widget.alert.zone ?? 'Zona no especificada',
              style: TextStyle(
                color: onSurface,
                fontSize: 18,
                fontWeight: FontWeight.bold,
                letterSpacing: -0.3,
              ),
            ),
          ),

          const SizedBox(height: 4),

          // 5. Descripción del incidente
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Text(
              widget.alert.description,
              style: TextStyle(
                color: onSurface.withValues(alpha: 0.75),
                fontSize: 14,
                height: 1.5,
              ),
            ),
          ),

          const SizedBox(height: 6),

          // 6. Fecha de creación y contribuciones
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Text(
              _timeAgo(widget.alert.createdAt) +
                  (contributions > 0 ? '  •  contribuciones: $contributions' : ''),
              style: TextStyle(
                color: onSurface.withValues(alpha: 0.6),
                fontSize: 10,
                fontWeight: FontWeight.normal,
              ),
            ),
          ),

          const SizedBox(height: 12),

          // 4. Carrusel de imágenes interactivo
          if (widget.alert.images.isNotEmpty)
            widget.isInBottomSheet
                ? SizedBox(
                    height: 180,
                    width: double.infinity,
                    child: _buildImageCarousel(),
                  )
                : AspectRatio(
                    aspectRatio: _aspectRatio,
                    child: _buildImageCarousel(),
                  ),

          // Action bar style Instagram
          if (widget.isInBottomSheet)
            Padding(
              padding: const EdgeInsets.only(left: 16, right: 16, top: 12),
              child: Row(
                children: [
                  Expanded(
                    child: TextButton.icon(
                      onPressed: () {
                        Navigator.of(context, rootNavigator: true).push(
                          PageRouteBuilder(
                            pageBuilder: (context, animation, secondaryAnimation) => CommentsScreen(alertId: widget.alert.id),
                            transitionsBuilder: (context, animation, secondaryAnimation, child) {
                              const begin = Offset(0.0, 1.0);
                              const end = Offset.zero;
                              const curve = Curves.ease;
                              var tween = Tween(begin: begin, end: end).chain(CurveTween(curve: curve));
                              return SlideTransition(position: animation.drive(tween), child: child);
                            },
                          ),
                        );
                      },
                      icon: Icon(Icons.chat, color: onSurface, size: 16),
                      label: Text('RESPONDER', style: TextStyle(color: onSurface, fontWeight: FontWeight.bold, fontSize: 13)),
                      style: TextButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        backgroundColor: Colors.transparent,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(24),
                          side: BorderSide(color: onSurface, width: 1.0),
                        ),
                      ),
                    ),
                  ),
                  if (widget.onContribute != null) ...[
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextButton.icon(
                        onPressed: widget.onContribute,
                        icon: Icon(Icons.add_a_photo_rounded, color: onSurface, size: 16),
                        label: Text('APORTAR', style: TextStyle(color: onSurface, fontWeight: FontWeight.bold, fontSize: 13)),
                        style: TextButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          backgroundColor: Colors.transparent,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(24),
                            side: BorderSide(color: onSurface, width: 1.0),
                        ),
                      ),
                    ),
                    ),
                  ],
                ],
              ),
            )
          else
            Padding(
              padding: const EdgeInsets.only(left: 16, right: 16, top: 12),
              child: Row(
                children: [
                  Expanded(
                    child: TextButton.icon(
                      onPressed: () {
                        Navigator.of(context, rootNavigator: true).push(
                          PageRouteBuilder(
                            pageBuilder: (context, animation, secondaryAnimation) => CommentsScreen(alertId: widget.alert.id),
                            transitionsBuilder: (context, animation, secondaryAnimation, child) {
                              const begin = Offset(0.0, 1.0);
                              const end = Offset.zero;
                              const curve = Curves.ease;
                              var tween = Tween(begin: begin, end: end).chain(CurveTween(curve: curve));
                              return SlideTransition(position: animation.drive(tween), child: child);
                            },
                          ),
                        );
                      },
                      icon: Icon(Icons.chat, color: onSurface, size: 16),
                      label: Text('RESPONDER', style: TextStyle(color: onSurface, fontWeight: FontWeight.bold, fontSize: 13)),
                      style: TextButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        backgroundColor: Colors.transparent,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(24),
                          side: BorderSide(color: onSurface, width: 1.0),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextButton.icon(
                      onPressed: widget.onTap,
                      icon: Icon(Icons.explore, color: onSurface, size: 16),
                      label: Text('NAVEGAR', style: TextStyle(color: onSurface, fontWeight: FontWeight.bold, fontSize: 13)),
                      style: TextButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        backgroundColor: Colors.transparent,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(24),
                          side: BorderSide(color: onSurface, width: 1.0),
                        ),
                      ),
                    ),
                  ),
                ],
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
                    backgroundColor: const Color(0xFF6D8566),
                    foregroundColor: Colors.white,
                    elevation: 0,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(25),
                    ),
                  ),
                  onPressed: widget.onVerify,
                  icon: const Icon(Icons.verified_outlined, size: 18),
                  label: const Text('VERIFICAR INCIDENTE', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                ),
              ),
            ),
              const SizedBox(height: 16),
        ],
      ),
    );
  }
}
