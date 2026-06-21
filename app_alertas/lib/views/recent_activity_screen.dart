import 'package:flutter/material.dart';
import 'package:app_alertas/core/utils/error_handler.dart';
import 'package:skeletonizer/skeletonizer.dart';

import 'package:app_alertas/models/alert_model.dart';
import 'package:app_alertas/viewmodels/alert_viewmodel.dart';
import 'package:app_alertas/core/utils/role_utils.dart';
import 'package:app_alertas/viewmodels/auth_viewmodel.dart';
import 'package:provider/provider.dart';
import 'package:app_alertas/views/alert_card.dart';

import 'package:app_alertas/services/location_service.dart';
import 'package:latlong2/latlong.dart';
import 'dart:math' as math;
import 'package:app_alertas/views/create_alert_screen.dart';
import 'package:app_alertas/views/main_navigation_screen.dart';
import 'dart:async';

class RecentActivityScreen extends StatefulWidget {
  final Function(AlertModel, {bool traceRoute})? onAlertTap;
  const RecentActivityScreen({super.key, this.onAlertTap});

  @override
  State<RecentActivityScreen> createState() => RecentActivityScreenState();
}

class RecentActivityScreenState extends State<RecentActivityScreen> {
  String? _selectedType;
  bool _onlyNearby = false;
  LatLng? _userLocation;
  final _locationService = const LocationService();
  int _currentLoadId = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadAlerts();
    });
  }

  @override
  void dispose() {
    super.dispose();
  }

  Future<void> reload() => _loadAlerts();

  double _distanceInMeters(LatLng a, LatLng b) {
    const earthRadius = 6371000.0;
    final lat1 = a.latitudeInRad;
    final lat2 = b.latitudeInRad;
    final dLat = (b.latitude - a.latitude) * math.pi / 180;
    final dLon = (b.longitude - a.longitude) * math.pi / 180;
    final x =
        math.sin(dLat / 2) * math.sin(dLat / 2) +
        math.cos(lat1) * math.cos(lat2) * math.sin(dLon / 2) * math.sin(dLon / 2);
    final c = 2 * math.atan2(math.sqrt(x), math.sqrt(1 - x));
    return earthRadius * c;
  }

  LatLng? _getAlertLatLng(AlertModel alert) {
    if (alert.coordinates.length < 2) return null;
    return LatLng(alert.coordinates[1], alert.coordinates[0]);
  }

  Future<void> _loadAlerts() async {
    final alertVM = context.read<AlertViewModel>();
    final user = context.read<AuthViewModel>().user;
    final int loadId = ++_currentLoadId;

    await alertVM.fetchAlerts(
      includeDeleted: isStaffRole(user?.roleId, user?.roleName),
    );

    if (loadId != _currentLoadId) return;

    if (_onlyNearby) {
      try {
        final loc = await _locationService.getCurrentLocation();
        if (loadId == _currentLoadId && mounted) {
          setState(() {
            _userLocation = loc;
          });
        }
      } catch (e) {
        if (loadId != _currentLoadId) return;

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('No se pudo obtener tu ubicación para filtrar los reportes.'),
              backgroundColor: Colors.orange,
              duration: Duration(seconds: 4),
            ),
          );
          setState(() {
            _userLocation = null;
            _onlyNearby = false;
          });
        }
      }
    } else {
      if (mounted) {
        setState(() {
          _userLocation = null;
        });
      }
    }
  }

  Future<void> _verifyAlert(AlertModel alert) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: Theme.of(ctx).cardTheme.color,
        title: Text(
          'Confirmar verificación',
          style: TextStyle(color: Theme.of(ctx).colorScheme.onSurface),
        ),
        content: Text(
          '¿Estás seguro de que deseas verificar este reporte como autoridad?',
          style: TextStyle(color: Theme.of(ctx).colorScheme.onSurface.withValues(alpha: 0.7)),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancelar', style: TextStyle(color: Colors.grey)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text(
              'Verificar',
              style: TextStyle(color: Colors.green),
            ),
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
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('¡Reporte verificado exitosamente!'),
            backgroundColor: Colors.green,
            duration: Duration(seconds: 4),
          ),
        );
      }

      await _loadAlerts();
    } catch (e) {
      if (mounted) Navigator.pop(context); // cerrar loading
      if (mounted) {
        _showErrorDialog(parseError(e));
      }
    }
  }

  void _showErrorDialog(String message) {
    showDialog(
      context: context,
      builder: (ctx) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        backgroundColor: Theme.of(ctx).cardTheme.color,
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
                child: const Icon(
                  Icons.error_outline,
                  color: Colors.red,
                  size: 40,
                ),
              ),
              const SizedBox(height: 20),
              Text(
                'No se pudo verificar',
                style: TextStyle(
                  color: Theme.of(ctx).colorScheme.onSurface,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                message,
                textAlign: TextAlign.center,
                style: TextStyle(color: Theme.of(ctx).colorScheme.onSurface.withValues(alpha: 0.7), fontSize: 15),
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
                  child: const Text(
                    'Entendido',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
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
      backgroundColor: Theme.of(context).cardTheme.color,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return _FilterBottomSheet(
          alerts: alerts,
          initialType: _selectedType,
          initialOnlyNearby: _onlyNearby,
          onConfirm: (type, onlyNearby) {
            final bool changed = _onlyNearby != onlyNearby;
            setState(() {
              _selectedType = type;
              _onlyNearby = onlyNearby;
            });
            Navigator.of(ctx).pop();
            if (changed) {
              _loadAlerts();
            }
          },
          onReset: () {
            final bool changed = _onlyNearby != false;
            setState(() {
              _selectedType = null;
              _onlyNearby = false;
            });
            Navigator.of(ctx).pop();
            if (changed) {
              _loadAlerts();
            }
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
      if (_selectedType != null && alert.type != _selectedType) {
        return false;
      }
      if (_onlyNearby) {
        if (_userLocation == null) return false;
        final alertLoc = _getAlertLatLng(alert);
        if (alertLoc == null) return false;
        final distance = _distanceInMeters(_userLocation!, alertLoc);
        if (distance > 5000.0) {
          return false;
        }
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
              padding: const EdgeInsets.fromLTRB(24, 10, 24, 0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    "Actividad Reciente",
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.normal,
                      letterSpacing: -0.3,
                      color: Theme.of(context).colorScheme.onSurface,
                    ),
                  ),
                  TextButton.icon(
                    onPressed: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => CreateAlertScreen(
                            onCreated: () {
                              Navigator.of(context).pop();
                              _loadAlerts();
                            },
                            onShowMap: (alert, {bool traceRoute = false}) {
                              Navigator.of(context).pop();
                              MainNavigationScreen.navigationKey.currentState?.navigateToMap(alert, traceRoute: traceRoute);
                            },
                          ),
                        ),
                      );
                    },
                    icon: Icon(Icons.add, size: 14, color: Theme.of(context).colorScheme.onSurface),
                    label: Text(
                      'CREAR REPORTE',
                      style: TextStyle(
                        color: Theme.of(context).colorScheme.onSurface,
                        fontWeight: FontWeight.normal,
                        fontSize: 12,
                      ),
                    ),
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      minimumSize: Size.zero,
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      backgroundColor: Theme.of(context).cardTheme.color,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                        side: BorderSide(
                          color: Theme.of(context).brightness == Brightness.dark
                              ? Colors.white.withValues(alpha: 0.05)
                              : Colors.black.withValues(alpha: 0.05),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            GestureDetector(
              onTap: () => _openFilterBottomSheet(alerts),
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 8,
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.filter_list,
                      color: Theme.of(context).colorScheme.onSurface.withValues(
                        alpha: 0.6,
                      ),
                      size: 16,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Wrap(
                        spacing: 8,
                        runSpacing: 4,
                        crossAxisAlignment: WrapCrossAlignment.center,
                        children: [
                          if (_selectedType == null && !_onlyNearby)
                            Text(
                              'Filtrar Reportes',
                              style: TextStyle(
                                color: Theme.of(context).colorScheme.onSurface.withValues(
                                  alpha: 0.6,
                                ),
                                fontSize: 14,
                                fontWeight: FontWeight.normal,
                              ),
                            ),
                          if (_selectedType != null)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                              decoration: BoxDecoration(
                                color: Theme.of(context).brightness == Brightness.dark
                                    ? const Color(0xFF40403E)
                                    : const Color(0xFFE5E5E5),
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    _selectedType!,
                                    style: TextStyle(color: Theme.of(context).colorScheme.onSurface, fontSize: 13),
                                  ),
                                  const SizedBox(width: 4),
                                  GestureDetector(
                                    onTap: () {
                                      setState(() {
                                        _selectedType = null;
                                      });
                                    },
                                    child: Icon(Icons.close, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.7), size: 14),
                                  ),
                                ],
                              ),
                            ),
                          if (_onlyNearby)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                              decoration: BoxDecoration(
                                color: Theme.of(context).brightness == Brightness.dark
                                    ? const Color(0xFF40403E)
                                    : const Color(0xFFE5E5E5),
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    "Cercanos",
                                    style: TextStyle(color: Theme.of(context).colorScheme.onSurface, fontSize: 13),
                                  ),
                                  const SizedBox(width: 4),
                                  GestureDetector(
                                    onTap: () {
                                      setState(() {
                                        _onlyNearby = false;
                                      });
                                      _loadAlerts();
                                    },
                                    child: Icon(Icons.close, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.7), size: 14),
                                  ),
                                ],
                              ),
                            ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 8),
            Expanded(
              child: RefreshIndicator(
                onRefresh: _loadAlerts,
                displacement: 20,
                child: Skeletonizer(
                  enabled: loading && alerts.isEmpty,
                  effect: ShimmerEffect(
                    baseColor: Theme.of(context).brightness == Brightness.dark
                        ? const Color(0xFF2C2C2A)
                        : const Color(0xFFE0E0E0),
                    highlightColor: Theme.of(context).brightness == Brightness.dark
                        ? const Color(0xFF30302E)
                        : const Color(0xFFF5F5F5),
                  ),
                  child: alerts.isEmpty && !loading
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.notifications_none_rounded,
                                size: 64,
                                color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.1),
                              ),
                              const SizedBox(height: 16),
                              const Text(
                                'No hay actividad reciente',
                                style: TextStyle(color: Colors.grey),
                              ),
                            ],
                          ),
                        )
                      : CustomScrollView(
                          slivers: [
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
                                      delegate: SliverChildBuilderDelegate((
                                        context,
                                        index,
                                      ) {
                                        final alert = displayAlerts[index];
                                        return AlertCard(
                                          alert: alert,
                                          onTap: () =>
                                              widget.onAlertTap?.call(alert),
                                          onVerify: () => _verifyAlert(alert),
                                        );
                                      }, childCount: displayAlerts.length),
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
  final String? initialType;
  final bool initialOnlyNearby;
  final Function(String?, bool) onConfirm;
  final VoidCallback onReset;

  const _FilterBottomSheet({
    required this.alerts,
    this.initialType,
    required this.initialOnlyNearby,
    required this.onConfirm,
    required this.onReset,
  });

  @override
  State<_FilterBottomSheet> createState() => _FilterBottomSheetState();
}

class _FilterBottomSheetState extends State<_FilterBottomSheet> {
  String? _selectedType;
  late bool _onlyNearby;

  @override
  void initState() {
    super.initState();
    _selectedType = widget.initialType;
    _onlyNearby = widget.initialOnlyNearby;
  }

  @override
  Widget build(BuildContext context) {
    final Map<String, int> typeCounts = {};
    for (var alert in widget.alerts) {
      final type = alert.type;
      if (type.isNotEmpty) {
        typeCounts[type] = (typeCounts[type] ?? 0) + 1;
      }
    }
    final sortedTypes = typeCounts.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));

    return FractionallySizedBox(
      heightFactor: 0.9,
      child: Column(
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 16, 24, 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    IconButton(
                      icon: Icon(Icons.arrow_back, color: Theme.of(context).colorScheme.onSurface),
                      onPressed: () => Navigator.of(context).pop(),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      "Filtrar por",
                      style: TextStyle(
                        color: Theme.of(context).colorScheme.onSurface,
                        fontSize: 20,
                        fontWeight: FontWeight.normal,
                      ),
                    ),
                  ],
                ),
                TextButton(
                  onPressed: widget.onReset,
                  child: const Text(
                    'Restablecer',
                    style: TextStyle(
                      color: Color(0xFFAF6D58),
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ),
          Divider(height: 1, color: Theme.of(context).dividerColor),

          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              children: [
                Text(
                  'UBICACIÓN',
                  style: TextStyle(
                    color: Theme.of(context).colorScheme.onSurface,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.2,
                  ),
                ),
                const SizedBox(height: 12),
                _FilterRowItem(
                  label: 'Solo reportes cercanos',
                  isSelected: _onlyNearby,
                  onTap: () => setState(() => _onlyNearby = !_onlyNearby),
                ),
                const SizedBox(height: 16),
                Divider(height: 1, color: Theme.of(context).dividerColor),
                const SizedBox(height: 16),
                Text(
                  'TIPO DE INCIDENTE',
                  style: TextStyle(
                    color: Theme.of(context).colorScheme.onSurface,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.2,
                  ),
                ),
                const SizedBox(height: 12),
                _FilterRowItem(
                  label: 'Todos',
                  isSelected: _selectedType == null,
                  onTap: () => setState(() => _selectedType = null),
                ),
                ...sortedTypes.map(
                  (t) => _FilterRowItem(
                    label: t.key,
                    isSelected: _selectedType == t.key,
                    onTap: () => setState(() => _selectedType = t.key),
                  ),
                ),
              ],
            ),
          ),

          Padding(
            padding: const EdgeInsets.all(24),
            child: SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFAF6D58),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(25),
                  ),
                ),
                onPressed: () => widget.onConfirm(_selectedType, _onlyNearby),
                child: const Text(
                  'Confirmar',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
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
    required this.label,
    required this.isSelected,
    required this.onTap,
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
              width: 22,
              height: 22,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: isSelected
                      ? const Color(0xFFAF6D58)
                      : Colors.grey.withValues(alpha: 0.5),
                  width: 2,
                ),
                color: isSelected
                    ? const Color(0xFFAF6D58)
                    : Colors.transparent,
              ),
              child: isSelected
                  ? const Icon(Icons.check, size: 14, color: Colors.white)
                  : null,
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Text(
                label,
                style: TextStyle(
                  color: isSelected
                      ? Theme.of(context).colorScheme.onSurface
                      : Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.8),
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
