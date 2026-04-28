import 'package:flutter/material.dart';
import 'package:app_alertas/data/models/alert_model.dart';
import 'package:app_alertas/data/services/alerts_api_service.dart';
import 'package:provider/provider.dart';
import 'package:app_alertas/presentation/providers/auth_provider.dart';
import 'package:app_alertas/presentation/screens/alert_card.dart';

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
    if (!mounted) return;
    setState(() => _loading = true);
    try {
      final data = await _service.getAlerts();
      if (!mounted) return;
      
      final user = context.read<AuthProvider>().user;
      final isAuthority = user?.roleId == 2;

      setState(() {
        if (isAuthority) {
          _alerts = data;
        } else {
          _alerts = data.where((a) => a.userId == user?.id).toList();
        }
      });
    } catch (e) {
      debugPrint('Error cargando historial: $e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> reload() => loadAlerts();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Historial de Alertas")),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: loadAlerts,
              child: _alerts.isEmpty
                  ? const Center(child: Text('No hay alertas registradas'))
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _alerts.length,
                      itemBuilder: (context, index) {
                        final item = _alerts[index];
                        return _buildItem(item);
                      },
                    ),
            ),
    );
  }

  Widget _buildItem(AlertModel alert) {
    return AlertCard(alert: alert);
  }
}
