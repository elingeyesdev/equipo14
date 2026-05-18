import 'package:flutter/material.dart';
import 'dart:convert';

import 'package:app_alertas/models/alert_model.dart';
import 'package:app_alertas/viewmodels/alert_viewmodel.dart';
import 'package:provider/provider.dart';
import 'package:app_alertas/views/alert_card.dart';
import 'package:app_alertas/views/widgets/custom_snackbar.dart';

class RecentActivityScreen extends StatefulWidget {
  final Function(AlertModel)? onAlertTap;
  const RecentActivityScreen({super.key, this.onAlertTap});

  @override
  State<RecentActivityScreen> createState() => RecentActivityScreenState();
}

/// Filtros de segunda fila: alineados con las reglas de credibilidad de la lista.
enum _PriorityFilter {
  all,
  highPriority,
  verifiedAuthority,
  credibilityHigh,
  credibilityModerate,
  credibilityLow,
}

extension _PriorityFilterMatch on _PriorityFilter {
  bool matches(AlertModel a) {
    switch (this) {
      case _PriorityFilter.all:
        return true;
      case _PriorityFilter.highPriority:
        return a.verified || a.weight >= 20;
      case _PriorityFilter.verifiedAuthority:
        return a.verified;
      case _PriorityFilter.credibilityHigh:
        return !a.verified && a.weight >= 20;
      case _PriorityFilter.credibilityModerate:
        return !a.verified && a.weight >= 15 && a.weight < 20;
      case _PriorityFilter.credibilityLow:
        return !a.verified && a.weight < 15;
    }
  }

  String get chipLabel {
    switch (this) {
      case _PriorityFilter.all:
        return 'PRI. TODAS';
      case _PriorityFilter.highPriority:
        return 'ALTA PRIOR.';
      case _PriorityFilter.verifiedAuthority:
        return 'VERIFICADO';
      case _PriorityFilter.credibilityHigh:
        return 'CRED. ALTA';
      case _PriorityFilter.credibilityModerate:
        return 'CRED. MOD.';
      case _PriorityFilter.credibilityLow:
        return 'CRED. BAJA';
    }
  }
}

class RecentActivityScreenState extends State<RecentActivityScreen> {
  String? _selectedZone;
  _PriorityFilter _priorityFilter = _PriorityFilter.all;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AlertViewModel>().fetchAlerts();
    });
  }

  Future<void> reload() => _loadAlerts();

  Future<void> _loadAlerts() async {
    await context.read<AlertViewModel>().fetchAlerts();
  }

  Future<void> _verifyAlert(AlertModel alert) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF26292E),
        title: const Text('Confirmar verificación', style: TextStyle(color: Colors.white)),
        content: const Text('¿Estás seguro de que deseas verificar este reporte como autoridad?', style: TextStyle(color: Colors.white70)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancelar', style: TextStyle(color: Colors.grey)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Verificar', style: TextStyle(color: Colors.green)),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    if (!mounted) return;
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const Center(child: CircularProgressIndicator()),
    );

    try {
      final alertVM = context.read<AlertViewModel>();
      await alertVM.verifyReport(alert.id);

      if (mounted) {
        Navigator.pop(context); // cerrar loading
        showCustomSnackBar(
          context: context,
          title: 'Éxito',
          message: '¡Reporte verificado exitosamente!',
          type: CustomSnackBarType.success,
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
        backgroundColor: const Color(0xFF26292E),
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

  Widget _buildZoneSummary(List<AlertModel> alerts) {
    final Map<String, int> zoneCounts = {};
    for (var alert in alerts) {
      final zone = alert.zone ?? 'Desconocida';
      zoneCounts[zone] = (zoneCounts[zone] ?? 0) + 1;
    }

    final sortedZones = zoneCounts.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));

    return Container(
      padding: const EdgeInsets.only(top: 0, bottom: 12),
      margin: const EdgeInsets.only(bottom: 8),
      decoration: const BoxDecoration(
        color: Colors.transparent, // Uniform color matching screen background
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Text(
              'Incidentes por Zona',
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.75),
                fontSize: 13,
                fontWeight: FontWeight.normal,
              ),
            ),
          ),
          const SizedBox(height: 10),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                _FilterChip(
                  label: 'TODAS',
                  count: alerts.length,
                  isSelected: _selectedZone == null,
                  onTap: () => setState(() => _selectedZone = null),
                ),
                ...sortedZones.map((entry) {
                  return _FilterChip(
                    label: entry.key,
                    count: entry.value,
                    isSelected: _selectedZone == entry.key,
                    onTap: () => setState(() => _selectedZone = entry.key),
                  );
                }),
              ],
            ),
          ),
          const SizedBox(height: 14),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Text(
              'Prioridad y credibilidad',
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.75),
                fontSize: 13,
                fontWeight: FontWeight.normal,
              ),
            ),
          ),
          const SizedBox(height: 8),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                for (final f in _PriorityFilter.values)
                  _FilterChip(
                    label: f.chipLabel,
                    count: alerts.where((a) => f.matches(a)).length,
                    isSelected: _priorityFilter == f,
                    onTap: () => setState(() => _priorityFilter = f),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final alertVM = context.watch<AlertViewModel>();
    final alerts = alertVM.alerts;
    final loading = alertVM.isLoading;

    return Scaffold(
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 20, 24, 0),
              child: const Text(
                "Actividad Reciente",
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.normal,
                  letterSpacing: -0.3,
                  color: Colors.white,
                ),
              ),
            ),
            const SizedBox(height: 12),
            Expanded(
              child: loading
                  ? const Center(child: CircularProgressIndicator())
                  : RefreshIndicator(
                      onRefresh: _loadAlerts,
                      displacement: 20,
                      color: const Color(0xFF3B82F6),
                      child: alerts.isEmpty
                          ? Center(
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.notifications_none_rounded, size: 64, color: Colors.white.withValues(alpha: 0.1)),
                                  const SizedBox(height: 16),
                                  const Text('No hay actividad reciente', style: TextStyle(color: Colors.grey)),
                                ],
                              ),
                            )
                          : CustomScrollView(
                              slivers: [
                                SliverToBoxAdapter(child: _buildZoneSummary(alerts)),
                                SliverPadding(
                                  padding: EdgeInsets.zero,
                                  sliver: SliverList(
                                    delegate: SliverChildBuilderDelegate(
                                      (context, index) {
                                        final alert = alerts[index];
                                        if (_selectedZone != null && (alert.zone ?? 'Desconocida') != _selectedZone) {
                                          return const SizedBox.shrink();
                                        }
                                        if (!_priorityFilter.matches(alert)) {
                                          return const SizedBox.shrink();
                                        }
                                        return AlertCard(
                                          alert: alert,
                                          onTap: () => widget.onAlertTap?.call(alert),
                                          onVerify: () => _verifyAlert(alert),
                                        );
                                      },
                                      childCount: alerts.length,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                    ),
            ),
          ],
        ),
      ),
    );
  }


}

class _FilterChip extends StatelessWidget {
  final String label;
  final int count;
  final bool isSelected;
  final VoidCallback onTap;

  const _FilterChip({
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
        margin: const EdgeInsets.only(right: 6),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF3B82F6) : Colors.transparent,
          borderRadius: BorderRadius.zero,
          border: Border.all(
            color: isSelected
                ? const Color(0xFF3B82F6)
                : Colors.white.withValues(alpha: 0.15),
            width: 1,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label.toUpperCase(),
              style: TextStyle(
                color: isSelected ? Colors.white : Colors.grey,
                fontSize: 9.5,
                fontWeight: FontWeight.w800,
                letterSpacing: 0.2,
              ),
            ),
            const SizedBox(width: 5),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
              decoration: BoxDecoration(
                color: isSelected
                    ? Colors.white.withValues(alpha: 0.2)
                    : Colors.white.withValues(alpha: 0.05),
                borderRadius: BorderRadius.zero,
              ),
              child: Text(
                '$count',
                style: TextStyle(
                  color: isSelected ? Colors.white : Colors.white70,
                  fontSize: 10,
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



