import 'package:flutter/material.dart';

import 'package:app_alertas/data/models/alert_model.dart';
import 'package:app_alertas/data/services/alerts_api_service.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final _service = AlertsApiService();
  List<AlertModel> _alerts = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadAlerts();
  }

  Future<void> _loadAlerts() async {
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                "Notificaciones recientes",
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 20),
              Expanded(
                child: _loading
                    ? const Center(child: CircularProgressIndicator())
                    : RefreshIndicator(
                        onRefresh: _loadAlerts,
                        child: _alerts.isEmpty
                            ? const Center(child: Text('No hay notificaciones'))
                            : ListView.builder(
                                itemCount: _alerts.length,
                                itemBuilder: (context, index) {
                                  final alert = _alerts[index];
                                  return buildItem(alert);
                                },
                              ),
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget buildItem(AlertModel alert) {
    String typeLabel = alert.type.toUpperCase() == 'ROBO'
        ? 'Robo'
        : alert.type.toUpperCase() == 'INCENDIO'
            ? 'Incendio'
            : alert.type.toUpperCase() == 'ACCIDENTE'
                ? 'Accidente'
                : alert.type;

    Color color = Colors.grey;
    if (typeLabel == 'Robo') color = Colors.red;
    if (typeLabel == 'Incendio') color = Colors.orange;
    if (typeLabel == 'Accidente') color = Colors.blue;

    final time = alert.createdAt != null
        ? '${alert.createdAt!.day}/${alert.createdAt!.month}/${alert.createdAt!.year} ${alert.createdAt!.hour}:${alert.createdAt!.minute.toString().padLeft(2, '0')}'
        : 'Reciente';

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(15),
      ),
      child: Row(
        children: [
          Icon(Icons.notifications_active, color: color),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '$typeLabel reportado',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
                Text(
                  alert.description,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(color: Colors.white70, fontSize: 13),
                ),
                const SizedBox(height: 4),
                Text(time, style: const TextStyle(color: Colors.grey, fontSize: 12)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
