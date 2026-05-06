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
              child: CustomScrollView(
                slivers: [
                  if (_alerts.isNotEmpty)
                    SliverToBoxAdapter(
                      child: _buildZoneSummary(),
                    ),
                  SliverPadding(
                    padding: const EdgeInsets.all(16),
                    sliver: SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (context, index) => _buildItem(_alerts[index]),
                        childCount: _alerts.length,
                      ),
                    ),
                  ),
                  if (_alerts.isEmpty)
                    const SliverFillRemaining(
                      child: Center(child: Text('No hay alertas registradas')),
                    ),
                ],
              ),
            ),
    );
  }

  String? _selectedZone;

  Widget _buildZoneSummary() {
    final Map<String, int> zoneCounts = {};
    for (var alert in _alerts) {
      final zone = alert.zone ?? 'Desconocida';
      zoneCounts[zone] = (zoneCounts[zone] ?? 0) + 1;
    }

    final sortedZones = zoneCounts.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 20),
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B).withValues(alpha: 0.3),
        borderRadius: const BorderRadius.vertical(bottom: Radius.circular(24)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 20),
            child: Text(
              'Incidentes por Zona',
              style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
            ),
          ),
          const SizedBox(height: 16),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                _ZoneChip(
                  label: 'TODAS',
                  count: _alerts.length,
                  isSelected: _selectedZone == null,
                  onTap: () => setState(() => _selectedZone = null),
                ),
                ...sortedZones.map((entry) {
                  return _ZoneChip(
                    label: entry.key,
                    count: entry.value,
                    isSelected: _selectedZone == entry.key,
                    onTap: () => setState(() => _selectedZone = entry.key),
                  );
                }),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildItem(AlertModel alert) {
    if (_selectedZone != null && alert.zone != _selectedZone) {
      return const SizedBox.shrink();
    }
    return AlertCard(alert: alert);
  }
}

class _ZoneChip extends StatelessWidget {
  final String label;
  final int count;
  final bool isSelected;
  final VoidCallback onTap;

  const _ZoneChip({
    required this.label,
    required this.count,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(right: 10),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF3B82F6) : const Color(0xFF1E293B),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? Colors.white.withValues(alpha: 0.2) : Colors.white.withValues(alpha: 0.05),
          ),
          boxShadow: isSelected ? [
            BoxShadow(
              color: const Color(0xFF3B82F6).withValues(alpha: 0.3),
              blurRadius: 8,
              offset: const Offset(0, 4),
            )
          ] : null,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label.toUpperCase(),
              style: TextStyle(
                color: isSelected ? Colors.white : Colors.grey,
                fontSize: 11,
                fontWeight: FontWeight.w800,
                letterSpacing: 0.5,
              ),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: isSelected ? Colors.white.withValues(alpha: 0.2) : Colors.white.withValues(alpha: 0.05),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                '$count',
                style: TextStyle(
                  color: isSelected ? Colors.white : Colors.white70,
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
