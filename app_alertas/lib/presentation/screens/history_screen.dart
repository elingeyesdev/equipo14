import 'package:flutter/material.dart';
import 'package:app_alertas/data/models/alert_model.dart';
import 'package:app_alertas/data/services/alerts_api_service.dart';

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});

  @override
  State<HistoryScreen> createState() => HistoryScreenState();
}

class HistoryScreenState extends State<HistoryScreen> {
  final _service = AlertsApiService();
  bool _loading = true;
  List<AlertModel> _alerts = const [];

  @override
  void initState() {
    super.initState();
    loadAlerts();
  }

  Future<void> loadAlerts() async {
    setState(() => _loading = true);
    try {
      final data = await _service.getAlerts();
      if (!mounted) return;
      setState(() => _alerts = data);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> reload() => loadAlerts();

  Future<void> _deleteAlert(AlertModel alert) async {
    try {
      await _service.deleteAlert(alert.id);
      await loadAlerts();
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Alerta eliminada')));
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('No se pudo eliminar: $e')));
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
                "Historial",
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 20),

              Expanded(
                child: _loading
                    ? const Center(child: CircularProgressIndicator())
                    : RefreshIndicator(
                        onRefresh: loadAlerts,
                        child: _alerts.isEmpty
                            ? const Center(
                                child: Text('No hay alertas registradas'),
                              )
                            : ListView.builder(
                                itemCount: _alerts.length,
                                itemBuilder: (context, index) {
                                  final item = _alerts[index];
                                  return buildItem(item);
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
    final color = _alertColor(alert.type);
    final dateLabel = alert.createdAt != null
        ? '${alert.createdAt!.day}/${alert.createdAt!.month}/${alert.createdAt!.year}'
        : 'Sin fecha';

    final hasImages = alert.images.isNotEmpty;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(15),
      ),
      child: Row(
        children: [
          Icon(Icons.warning, color: color),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(_displayType(alert.type)),
                Text(
                  alert.description,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(color: Colors.grey),
                ),
                const SizedBox(height: 4),
                Text(dateLabel, style: const TextStyle(color: Colors.grey)),
                if (hasImages) ...[
                  const SizedBox(height: 8),
                  SizedBox(
                    height: 70,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemCount: alert.images.length,
                      separatorBuilder: (context, index) =>
                          const SizedBox(width: 8),
                      itemBuilder: (context, index) {
                        final imageUrl = alert.images[index].url;
                        return ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: Image.network(
                            imageUrl,
                            width: 90,
                            height: 70,
                            fit: BoxFit.cover,
                            loadingBuilder: (context, child, progress) {
                              if (progress == null) return child;
                              return Container(
                                width: 90,
                                height: 70,
                                color: const Color(0xFF0F172A),
                                alignment: Alignment.center,
                                child: const SizedBox(
                                  width: 18,
                                  height: 18,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                  ),
                                ),
                              );
                            },
                            errorBuilder: (context, error, stackTrace) =>
                                Container(
                                  width: 90,
                                  height: 70,
                                  color: const Color(0xFF0F172A),
                                  alignment: Alignment.center,
                                  child: const Icon(
                                    Icons.broken_image_outlined,
                                    color: Colors.grey,
                                  ),
                                ),
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.delete, color: Colors.redAccent),
            onPressed: () => _deleteAlert(alert),
          ),
        ],
      ),
    );
  }

  String _displayType(String type) {
    switch (type.toUpperCase()) {
      case 'ROBO':
        return 'Robo';
      case 'INCENDIO':
        return 'Incendio';
      case 'ACCIDENTE':
        return 'Accidente';
      default:
        return type;
    }
  }

  Color _alertColor(String type) {
    switch (type.toUpperCase()) {
      case 'ROBO':
        return Colors.red;
      case 'INCENDIO':
        return Colors.orange;
      case 'ACCIDENTE':
        return Colors.blue;
      default:
        return Colors.grey;
    }
  }
}
