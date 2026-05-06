import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:geolocator/geolocator.dart';
import 'dart:convert';

import 'package:app_alertas/data/models/alert_model.dart';
import 'package:app_alertas/data/services/alerts_api_service.dart';

class NotificationsScreen extends StatefulWidget {
  final Function(AlertModel)? onAlertTap;
  const NotificationsScreen({super.key, this.onAlertTap});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final _service = AlertsApiService();
  final _picker = ImagePicker();
  List<AlertModel> _alerts = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadAlerts();
  }

  Future<void> _loadAlerts() async {
    if (!mounted) return;
    setState(() => _loading = true);
    try {
      final data = await _service.getAlerts();
      if (!mounted) return;
      
      // Ordenar por más recientes primero
      data.sort((a, b) {
        if (a.createdAt == null || b.createdAt == null) return 0;
        return b.createdAt!.compareTo(a.createdAt!);
      });

      setState(() => _alerts = data);
    } catch (e) {
      debugPrint('Error cargando notificaciones: $e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _verifyAlert(AlertModel alert) async {
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.camera_alt),
              title: const Text('Tomar foto'),
              onTap: () => Navigator.pop(ctx, ImageSource.camera),
            ),
            ListTile(
              leading: const Icon(Icons.photo_library),
              title: const Text('Galería'),
              onTap: () => Navigator.pop(ctx, ImageSource.gallery),
            ),
          ],
        ),
      ),
    );
    if (source == null || !mounted) return;

    final pickedFile = await _picker.pickImage(source: source, imageQuality: 85);
    if (pickedFile == null || !mounted) return;

    final imageFile = File(pickedFile.path);

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const Center(child: CircularProgressIndicator()),
    );

    try {
      final serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        if (mounted) Navigator.pop(context);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Activa el GPS para verificar')),
          );
        }
        return;
      }

      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        if (mounted) Navigator.pop(context);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Se necesita permiso de ubicación')),
          );
        }
        return;
      }

      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 10),
      );

      await _service.verifyReport(
        reportId: alert.id,
        latitude: position.latitude,
        longitude: position.longitude,
        imageFile: imageFile,
      );

      if (mounted) Navigator.pop(context); // cerrar loading

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('¡Reporte verificado exitosamente!'),
            backgroundColor: Colors.green,
          ),
        );
      }

      await _loadAlerts();
    } catch (e) {
      if (mounted) Navigator.pop(context); // cerrar loading
      
      String errorMsg = e.toString();
      if (errorMsg.contains('Exception:')) {
        final parts = errorMsg.split(' — ');
        if (parts.length > 1) {
          try {
            final jsonError = jsonDecode(parts[1]);
            if (jsonError['message'] != null) {
              errorMsg = jsonError['message'];
            }
          } catch (_) {}
        }
      } else if (errorMsg.startsWith('Exception: ')) {
        errorMsg = errorMsg.replaceFirst('Exception: ', '');
      }

      if (mounted) {
        _showErrorDialog(errorMsg);
      }
    }
  }

  void _showErrorDialog(String message) {
    showDialog(
      context: context,
      builder: (ctx) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        backgroundColor: const Color(0xFF1E293B),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.red.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.error_outline, color: Colors.red, size: 40),
              ),
              const SizedBox(height: 20),
              const Text(
                'No se pudo verificar',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                message,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.white70, fontSize: 15),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.red,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text('Entendido', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 20, 24, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    "Actividad Reciente",
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.w900,
                      letterSpacing: -0.5,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    "Mantente al tanto de lo que sucede en tu zona",
                    style: TextStyle(color: Colors.white.withValues(alpha: 0.5), fontSize: 14),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            Expanded(
              child: _loading
                  ? const Center(child: CircularProgressIndicator())
                  : RefreshIndicator(
                      onRefresh: _loadAlerts,
                      displacement: 20,
                      color: const Color(0xFF3B82F6),
                      child: _alerts.isEmpty
                          ? Center(
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.notifications_none_rounded, size: 64, color: Colors.white.withValues(alpha: 0.1)),
                                  const SizedBox(height: 16),
                                  const Text('No hay notificaciones', style: TextStyle(color: Colors.grey)),
                                ],
                              ),
                            )
                          : ListView.builder(
                              padding: const EdgeInsets.symmetric(horizontal: 20),
                              itemCount: _alerts.length,
                              itemBuilder: (context, index) {
                                final alert = _alerts[index];
                                return _buildItem(alert);
                              },
                            ),
                    ),
            ),
          ],
        ),
      ),
    );
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

  Widget _buildItem(AlertModel alert) {
    final color = _alertColor(alert.type);
    final time = alert.createdAt != null
        ? '${alert.createdAt!.day}/${alert.createdAt!.month} ${alert.createdAt!.hour}:${alert.createdAt!.minute.toString().padLeft(2, '0')}'
        : 'Reciente';

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: alert.verified ? Colors.green.withValues(alpha: 0.3) : Colors.white.withValues(alpha: 0.05),
        ),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: () => widget.onAlertTap?.call(alert),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: color.withValues(alpha: 0.1),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(_alertIcon(alert.type), color: color, size: 22),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                alert.type.toUpperCase(),
                                style: TextStyle(
                                  color: color,
                                  fontWeight: FontWeight.w800,
                                  fontSize: 12,
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ),
                            if (alert.verified)
                              const Icon(Icons.verified, color: Colors.green, size: 16),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          alert.description,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 15,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            Icon(Icons.access_time_rounded, size: 12, color: Colors.white.withValues(alpha: 0.4)),
                            const SizedBox(width: 4),
                            Text(
                              time,
                              style: TextStyle(color: Colors.white.withValues(alpha: 0.4), fontSize: 11),
                            ),
                            const SizedBox(width: 12),
                            Icon(Icons.location_on_outlined, size: 12, color: Colors.white.withValues(alpha: 0.4)),
                            const SizedBox(width: 4),
                            Expanded(
                              child: Text(
                                alert.zone ?? 'Cerca de ti',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(color: Colors.white.withValues(alpha: 0.4), fontSize: 11),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              if (!alert.verified) ...[
                const SizedBox(height: 16),
                SizedBox(
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
                    onPressed: () => _verifyAlert(alert),
                    icon: const Icon(Icons.verified_outlined, size: 18),
                    label: const Text('VERIFICAR ESTE INCIDENTE', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
