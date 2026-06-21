import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:app_alertas/viewmodels/auth_viewmodel.dart';
import 'package:app_alertas/viewmodels/alert_viewmodel.dart';
import 'package:app_alertas/views/settings_screen.dart';
import 'package:app_alertas/models/alert_model.dart';
import 'package:skeletonizer/skeletonizer.dart';

class ProfilePage extends StatefulWidget {
  final Function(AlertModel)? onAlertTap;
  const ProfilePage({super.key, this.onAlertTap});

  @override
  State<ProfilePage> createState() => ProfilePageState();
}

class ProfilePageState extends State<ProfilePage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final userId = context.read<AuthViewModel>().user?.id;
      if (userId != null) {
        context.read<AlertViewModel>().fetchMyAlerts(userId);
      }
    });
  }

  Future<void> reload() async {
    final userId = context.read<AuthViewModel>().user?.id;
    if (userId != null) {
      await context.read<AlertViewModel>().fetchMyAlerts(userId);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthViewModel>();
    final alertVM = context.watch<AlertViewModel>();
    final user = auth.user;

    if (user == null) {
      return const Center(child: CircularProgressIndicator());
    }

    final fullName = '${user.firstName} ${user.lastName}'.trim();
    final initials = _initials(user.firstName, user.lastName);
    
    final loading = alertVM.isLoading;
    final myAlerts = (loading && alertVM.myAlerts.isEmpty)
        ? List.generate(6, (_) => AlertModel.mock())
        : alertVM.myAlerts;

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () => reload(),
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(
                    24,
                    2,
                    24,
                    0,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Hamburger Menu and Title
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            "Perfil",
                            style: TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.normal,
                              letterSpacing: -0.3,
                              color: Theme.of(context).colorScheme.onSurface,
                            ),
                          ),
                          IconButton(
                            icon: Icon(
                              Icons.menu,
                              color: Theme.of(context).colorScheme.onSurface,
                              size: 28,
                            ),
                            padding: EdgeInsets.zero,
                            constraints: const BoxConstraints(),
                            onPressed: () {
                              Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (_) => const SettingsScreen(),
                                ),
                              );
                            },
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      // Horizontal Header Section
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          Container(
                            width: 80,
                            height: 80,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: Theme.of(context).cardTheme.color ?? const Color(0xFF30302E),
                              border: Border.all(
                                color: Theme.of(context).brightness == Brightness.dark
                                    ? Colors.white.withOpacity(0.05)
                                    : Colors.black.withOpacity(0.05),
                                width: 1,
                              ),
                            ),
                            child: Center(
                              child: Text(
                                initials,
                                style: TextStyle(
                                  color: Theme.of(context).colorScheme.onSurface,
                                  fontSize: 28,
                                  fontWeight: FontWeight.w300,
                                  letterSpacing: 1.5,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 24),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  fullName,
                                  style: TextStyle(
                                    color: Theme.of(context).colorScheme.onSurface,
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(height: 16),
                                Row(
                                  children: [
                                    _StatItem(
                                      value: myAlerts.length.toString(),
                                      label: 'Reportes',
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 56),

                      Text(
                        "Mis Reportes",
                        style: TextStyle(
                          fontSize: 20,
                          letterSpacing: -0.3,
                          color: Theme.of(context).colorScheme.onSurface,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              SliverToBoxAdapter(
                child: const SizedBox(height: 20),
              ),

              if (myAlerts.isEmpty && !loading)
                SliverFillRemaining(
                  hasScrollBody: false,
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
                )
              else
                SliverPadding(
                  padding: const EdgeInsets.only(bottom: 24),
                  sliver: Skeletonizer.sliver(
                    enabled: loading && alertVM.myAlerts.isEmpty,
                    effect: Theme.of(context).brightness == Brightness.dark
                        ? const ShimmerEffect(
                            baseColor: Color(0xFF2C2C2A),
                            highlightColor: Color(0xFF30302E),
                          )
                        : ShimmerEffect(
                            baseColor: Colors.grey.shade300,
                            highlightColor: Colors.grey.shade100,
                          ),
                    child: SliverGrid(
                      gridDelegate:
                          const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 3,
                            crossAxisSpacing: 2,
                            mainAxisSpacing: 2,
                            childAspectRatio: 0.8,
                          ),
                      delegate: SliverChildBuilderDelegate((context, index) {
                        final alert = myAlerts[index];
                        return GestureDetector(
                          onTap: () => widget.onAlertTap?.call(alert),
                          onLongPress: () async {
                            final confirmed = await showDialog<bool>(
                              context: context,
                              builder: (ctx) => AlertDialog(
                                backgroundColor: const Color(0xFF30302E),
                                title: const Text(
                                  'Eliminar reporte',
                                  style: TextStyle(color: Colors.white),
                                ),
                                content: const Text(
                                  '¿Estás seguro de que quieres eliminar este reporte?',
                                  style: TextStyle(color: Colors.white70),
                                ),
                                actions: [
                                  TextButton(
                                    onPressed: () => Navigator.pop(ctx, false),
                                    child: const Text(
                                      'Cancelar',
                                      style: TextStyle(color: Colors.grey),
                                    ),
                                  ),
                                  TextButton(
                                    onPressed: () => Navigator.pop(ctx, true),
                                    child: const Text(
                                      'Eliminar',
                                      style: TextStyle(color: Colors.red),
                                    ),
                                  ),
                                ],
                              ),
                            );

                            if (confirmed == true && context.mounted) {
                              context.read<AlertViewModel>().deleteReport(
                                alert.id,
                              );
                            }
                          },
                          child: Stack(
                            fit: StackFit.expand,
                            children: [
                              Container(
                                decoration: BoxDecoration(
                                  color: Theme.of(context).cardTheme.color ?? const Color(0xFF30302E),
                                ),
                                clipBehavior: Clip.hardEdge,
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.stretch,
                                  children: [
                                    Expanded(
                                      child: alert.images.isNotEmpty
                                          ? Image.network(
                                              alert.images.first,
                                              fit: BoxFit.cover,
                                              errorBuilder: (ctx, err, stack) =>
                                                  const Center(
                                                    child: Icon(
                                                      Icons.broken_image,
                                                      color: Colors.grey,
                                                    ),
                                                  ),
                                            )
                                          : Center(
                                              child: Icon(
                                                Icons.warning_amber_rounded,
                                                color: Theme.of(context).brightness == Brightness.dark
                                                    ? Colors.white54
                                                    : Colors.black54,
                                                size: 32,
                                              ),
                                            ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        vertical: 6,
                                        horizontal: 2,
                                      ),
                                      color: Theme.of(context).brightness == Brightness.dark
                                          ? const Color(0xFF2C2C2A)
                                          : Colors.grey.shade100,
                                      child: Text(
                                        alert.type.toUpperCase(),
                                        textAlign: TextAlign.center,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: TextStyle(
                                          color: Theme.of(context).brightness == Brightness.dark
                                              ? Colors.white70
                                              : Colors.black87,
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold,
                                          letterSpacing: 0.5,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        );
                      }, childCount: myAlerts.length),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  String _initials(String? first, String? last) {
    final f = (first?.isNotEmpty == true) ? first![0].toUpperCase() : '';
    final l = (last?.isNotEmpty == true) ? last![0].toUpperCase() : '';
    return '$f$l';
  }
}

class _StatItem extends StatelessWidget {
  final String value;
  final String label;

  const _StatItem({required this.value, required this.label});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Text(
          value,
          style: TextStyle(
            color: Theme.of(context).colorScheme.onSurface,
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: const TextStyle(color: Color(0xFF64748B), fontSize: 12),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }
}
