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

      // Siempre mostrar solo los reportes del usuario actual
      setState(() {
        _alerts = data.where((a) => a.userId == user?.id).toList();
      });
    } catch (e) {
      debugPrint('Error cargando mis reportes: $e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> reload() => loadAlerts();

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
                    "Mis Reportes",
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.w900,
                      letterSpacing: -0.5,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    "Revisa los incidentes que has reportado",
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.5),
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            Expanded(
              child: _loading
                  ? const Center(child: CircularProgressIndicator())
                  : RefreshIndicator(
                      onRefresh: loadAlerts,
                      displacement: 20,
                      color: const Color(0xFF3B82F6),
                      child: _alerts.isEmpty
                          ? ListView(
                              children: [
                                SizedBox(
                                  height: MediaQuery.of(context).size.height * 0.5,
                                  child: Center(
                                    child: Column(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        Icon(
                                          Icons.assignment_outlined,
                                          size: 64,
                                          color: Colors.white.withValues(alpha: 0.1),
                                        ),
                                        const SizedBox(height: 16),
                                        const Text(
                                          'Aún no has creado ningún reporte',
                                          style: TextStyle(color: Colors.grey),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            )
                          : ListView.builder(
                              padding: const EdgeInsets.symmetric(horizontal: 20),
                              itemCount: _alerts.length,
                              itemBuilder: (context, index) => AlertCard(alert: _alerts[index]),
                            ),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
