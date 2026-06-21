import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';

class PermissionsScreen extends StatelessWidget {
  const PermissionsScreen({super.key});

  Future<void> _openSettings() async {
    try {
      await Geolocator.openAppSettings();
    } catch (e) {
      debugPrint('Error opening app settings: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    final onSurface = Theme.of(context).colorScheme.onSurface;

    return Scaffold(
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // App bar
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 2, 24, 0),
              child: Row(
                children: [
                  IconButton(
                    icon: Icon(Icons.arrow_back, color: onSurface),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    "Permisos",
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.normal,
                      letterSpacing: -0.3,
                      color: onSurface,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Lista de Permisos individuales pero juntos visualmente
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24.0),
              child: Column(
                children: [
                  _buildPermissionItem(
                    context,
                    icon: Icons.near_me_outlined,
                    title: 'Ubicación',
                    description:
                        'Para permitir el acceso a su ubicación, active el permiso en la configuración del sistema.',
                    borderRadius: const BorderRadius.only(
                      topLeft: Radius.circular(12),
                      topRight: Radius.circular(12),
                    ),
                    onTap: _openSettings,
                  ),
                  const SizedBox(height: 2),
                  _buildPermissionItem(
                    context,
                    icon: Icons.camera_alt_outlined,
                    title: 'Cámara y Galería',
                    description:
                        'Para permitir tomar fotos y seleccionar imágenes de la galería, active el permiso en la configuración del sistema.',
                    borderRadius: BorderRadius.zero,
                    onTap: _openSettings,
                  ),
                  const SizedBox(height: 2),
                  _buildPermissionItem(
                    context,
                    icon: Icons.notifications_none_outlined,
                    title: 'Notificaciones',
                    description:
                        'Para permitir el envío de alertas y notificaciones en tiempo real, active el permiso en la configuración del sistema.',
                    borderRadius: const BorderRadius.only(
                      bottomLeft: Radius.circular(12),
                      bottomRight: Radius.circular(12),
                    ),
                    onTap: _openSettings,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPermissionItem(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String description,
    required VoidCallback onTap,
    BorderRadius borderRadius = const BorderRadius.all(Radius.circular(12)),
  }) {
    final onSurface = Theme.of(context).colorScheme.onSurface;
    final cardColor = Theme.of(context).cardTheme.color ?? const Color(0xFF30302E);

    return Material(
      color: cardColor,
      borderRadius: borderRadius,
      child: InkWell(
        onTap: onTap,
        borderRadius: borderRadius,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Icono a la izquierda
              Icon(
                icon,
                color: onSurface.withValues(alpha: 0.8),
                size: 24,
              ),
              const SizedBox(width: 16),
              // Título y Descripción
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      title,
                      style: TextStyle(
                        color: onSurface,
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      description,
                      style: TextStyle(
                        color: onSurface.withValues(alpha: 0.6),
                        fontSize: 12.5,
                        height: 1.3,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              // Indicador visual de Configuración a la derecha
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'Configuración',
                    style: TextStyle(
                      color: onSurface.withValues(alpha: 0.7),
                      fontSize: 13.0,
                    ),
                  ),
                  const SizedBox(width: 4),
                  Icon(
                    Icons.open_in_new_rounded,
                    size: 14,
                    color: onSurface.withValues(alpha: 0.7),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
