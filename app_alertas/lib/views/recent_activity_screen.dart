import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:skeletonizer/skeletonizer.dart';

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
        return 'Todas';
      case _PriorityFilter.highPriority:
        return 'Alta prioridad';
      case _PriorityFilter.verifiedAuthority:
        return 'Verificado';
      case _PriorityFilter.credibilityHigh:
        return 'Credibilidad alta';
      case _PriorityFilter.credibilityModerate:
        return 'Credibilidad moderada';
      case _PriorityFilter.credibilityLow:
        return 'Credibilidad baja';
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

  void _openFilterBottomSheet(List<AlertModel> alerts) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF1E2126),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return _FilterBottomSheet(
          alerts: alerts,
          initialZone: _selectedZone,
          initialPriority: _priorityFilter,
          onConfirm: (zone, priority) {
            setState(() {
              _selectedZone = zone;
              _priorityFilter = priority;
            });
            Navigator.of(ctx).pop();
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final alertVM = context.watch<AlertViewModel>();
    final alerts = alertVM.alerts;
    final loading = alertVM.isLoading;

    final filteredAlerts = alerts.where((alert) {
      if (_selectedZone != null && (alert.zone ?? 'Desconocida') != _selectedZone) {
        return false;
      }
      if (!_priorityFilter.matches(alert)) {
        return false;
      }
      return true;
    }).toList();

    final displayAlerts = (loading && alerts.isEmpty)
        ? List.generate(5, (_) => AlertModel.mock())
        : filteredAlerts;

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
              child: RefreshIndicator(
                onRefresh: _loadAlerts,
                displacement: 20,
                color: const Color(0xFF3B82F6),
                child: Skeletonizer(
                  enabled: loading && alerts.isEmpty,
                  effect: const ShimmerEffect(
                    baseColor: Color(0xFF1E2126),
                    highlightColor: Color(0xFF26292E),
                  ),
                  child: alerts.isEmpty && !loading
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
                            SliverToBoxAdapter(
                              child: GestureDetector(
                                onTap: () => _openFilterBottomSheet(alerts),
                                child: Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
                                  child: Row(
                                    children: [
                                      Text(
                                        'Filtrar Reportes',
                                        style: TextStyle(
                                          color: Colors.white.withValues(alpha: 0.6),
                                          fontSize: 14,
                                          fontWeight: FontWeight.normal,
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Icon(Icons.filter_list, color: Colors.white.withValues(alpha: 0.6), size: 16),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                            SliverPadding(
                              padding: EdgeInsets.zero,
                              sliver: displayAlerts.isEmpty
                                  ? SliverFillRemaining(
                                      hasScrollBody: false,
                                      child: Center(
                                        child: Text(
                                          'No se hallaron coincidencias',
                                          style: TextStyle(
                                            color: Colors.grey,
                                            fontSize: 16,
                                          ),
                                        ),
                                      ),
                                    )
                                  : SliverList(
                                      delegate: SliverChildBuilderDelegate(
                                        (context, index) {
                                          final alert = displayAlerts[index];
                                          return AlertCard(
                                            alert: alert,
                                            onTap: () => widget.onAlertTap?.call(alert),
                                            onVerify: () => _verifyAlert(alert),
                                          );
                                        },
                                        childCount: displayAlerts.length,
                                      ),
                                    ),
                            ),
                          ],
                        ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FilterBottomSheet extends StatefulWidget {
  final List<AlertModel> alerts;
  final String? initialZone;
  final _PriorityFilter initialPriority;
  final Function(String?, _PriorityFilter) onConfirm;

  const _FilterBottomSheet({
    required this.alerts,
    this.initialZone,
    required this.initialPriority,
    required this.onConfirm,
  });

  @override
  State<_FilterBottomSheet> createState() => _FilterBottomSheetState();
}

class _FilterBottomSheetState extends State<_FilterBottomSheet> {
  String? _selectedZone;
  late _PriorityFilter _priorityFilter;

  @override
  void initState() {
    super.initState();
    _selectedZone = widget.initialZone;
    _priorityFilter = widget.initialPriority;
  }

  @override
  Widget build(BuildContext context) {
    final Map<String, int> zoneCounts = {};
    for (var alert in widget.alerts) {
      final zone = alert.zone ?? 'Desconocida';
      zoneCounts[zone] = (zoneCounts[zone] ?? 0) + 1;
    }
    final sortedZones = zoneCounts.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));

    return FractionallySizedBox(
      heightFactor: 0.9,
      child: Column(
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 16, 24, 16),
            child: Row(
              children: [
                 IconButton(
                    icon: const Icon(Icons.arrow_back, color: Colors.white),
                    onPressed: () => Navigator.of(context).pop(),
                 ),
                 const SizedBox(width: 8),
                 const Text("Filtrar por", style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.normal)),
              ],
            ),
          ),
          const Divider(height: 1, color: Color(0xFF26292E)),
          
          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              children: [
                const Text(
                  'INCIDENTES POR ZONA',
                  style: TextStyle(color: Color(0xFF64748B), fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1.2),
                ),
                const SizedBox(height: 12),
                _FilterRowItem(
                  label: 'Todas',
                  isSelected: _selectedZone == null,
                  onTap: () => setState(() => _selectedZone = null),
                ),
                ...sortedZones.map((z) => _FilterRowItem(
                  label: z.key,
                  isSelected: _selectedZone == z.key,
                  onTap: () => setState(() => _selectedZone = z.key),
                )),
                
                const SizedBox(height: 32),
                const Text(
                  'PRIORIDAD Y CREDIBILIDAD',
                  style: TextStyle(color: Color(0xFF64748B), fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1.2),
                ),
                const SizedBox(height: 12),
                for (final f in _PriorityFilter.values)
                  _FilterRowItem(
                    label: f.chipLabel,
                    isSelected: _priorityFilter == f,
                    onTap: () => setState(() => _priorityFilter = f),
                  ),
              ],
            )
          ),
          
          Padding(
             padding: const EdgeInsets.all(24),
             child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                   style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF3B82F6),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                   ),
                   onPressed: () => widget.onConfirm(_selectedZone, _priorityFilter),
                   child: const Text('Confirmar', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                ),
             ),
          ),
        ],
      ),
    );
  }
}

class _FilterRowItem extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _FilterRowItem({
    required this.label, required this.isSelected, required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 14),
        child: Row(
          children: [
            // Check on the far left
            Container(
              width: 22, height: 22,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: isSelected ? const Color(0xFF3B82F6) : Colors.grey.withValues(alpha: 0.5), width: 2),
                color: isSelected ? const Color(0xFF3B82F6) : Colors.transparent,
              ),
              child: isSelected ? const Icon(Icons.check, size: 14, color: Colors.white) : null,
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Text(
                label,
                style: TextStyle(
                  color: isSelected ? Colors.white : Colors.white.withValues(alpha: 0.8), 
                  fontSize: 14,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
