import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:app_alertas/viewmodels/auth_viewmodel.dart';
import 'package:app_alertas/viewmodels/alert_viewmodel.dart';
import 'package:app_alertas/views/emergency_services_screen.dart';
import 'package:app_alertas/viewmodels/theme_viewmodel.dart';
import 'package:app_alertas/views/permissions_screen.dart';
import 'package:app_alertas/views/my_account_screen.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthViewModel>();
    final themeVM = context.watch<ThemeViewModel>();
    final cardColor = Theme.of(context).cardTheme.color ?? const Color(0xFF30302E);
    final onSurfaceColor = Theme.of(context).colorScheme.onSurface;

    return Scaffold(
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 2, 24, 0),
              child: Row(
                children: [
                  IconButton(
                    icon: Icon(Icons.arrow_back, color: onSurfaceColor),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    "Configuración",
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.normal,
                      letterSpacing: -0.3,
                      color: onSurfaceColor,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Módulo principal con Perfil, Permisos y Modo de color
                    _buildSettingRow(
                      context,
                      icon: Icons.person_outline_rounded,
                      title: 'Mi cuenta',
                      borderRadius: const BorderRadius.only(
                        topLeft: Radius.circular(12),
                        topRight: Radius.circular(12),
                      ),
                      onTap: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => const MyAccountScreen(),
                          ),
                        );
                      },
                    ),
                    const SizedBox(height: 2),
                    _buildSettingRow(
                      context,
                      icon: Icons.android_outlined,
                      title: 'Permisos',
                      borderRadius: BorderRadius.zero,
                      onTap: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => const PermissionsScreen(),
                          ),
                        );
                      },
                    ),
                    const SizedBox(height: 2),
                    _buildSettingRow(
                      context,
                      icon: Icons.nights_stay_outlined,
                      title: 'Modo de color',
                      subtitle: themeVM.themeModeName,
                      borderRadius: const BorderRadius.only(
                        bottomLeft: Radius.circular(12),
                        bottomRight: Radius.circular(12),
                      ),
                      onTap: () => _showThemeDialog(context, themeVM),
                    ),
                    const SizedBox(height: 8),

                    // Servicios de Emergencia
                    Material(
                      color: cardColor,
                      borderRadius: BorderRadius.circular(12),
                      child: InkWell(
                        onTap: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) => const EmergencyServicesScreen(),
                            ),
                          );
                        },
                        borderRadius: BorderRadius.circular(12),
                        child: const Padding(
                          padding: EdgeInsets.symmetric(horizontal: 18.0, vertical: 16.0),
                          child: Row(
                            children: [
                              Icon(
                                Icons.local_hospital_outlined,
                                color: Color(0xFF3084D7),
                                size: 24,
                              ),
                              SizedBox(width: 16),
                              Text(
                                'Servicios de Emergencia',
                                style: TextStyle(
                                  color: Color(0xFF3084D7),
                                  fontSize: 16,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),

                    // Cerrar sesión
                    Material(
                      color: cardColor,
                      borderRadius: BorderRadius.circular(12),
                      child: InkWell(
                        onTap: () async {
                          showDialog(
                            context: context,
                            barrierDismissible: false,
                            builder: (_) => const Center(
                              child: CircularProgressIndicator(),
                            ),
                          );

                          try {
                            final alertVM = context.read<AlertViewModel>();
                            await auth.logout();
                            alertVM.clear();
                          } catch (e) {
                            debugPrint('Error durring logout: $e');
                          } finally {
                            if (context.mounted) {
                              Navigator.of(context).popUntil((route) => route.isFirst);
                            }
                          }
                        },
                        borderRadius: BorderRadius.circular(12),
                        child: const Padding(
                          padding: EdgeInsets.symmetric(horizontal: 18.0, vertical: 16.0),
                          child: Row(
                            children: [
                              Icon(
                                Icons.logout_rounded,
                                color: Color(0xFFB64D4C),
                                size: 24,
                              ),
                              SizedBox(width: 16),
                              Text(
                                'Cerrar sesión',
                                style: TextStyle(
                                  color: Color(0xFFB64D4C),
                                  fontSize: 16,
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
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSettingRow(
    BuildContext context, {
    required IconData icon,
    required String title,
    String? subtitle,
    required VoidCallback onTap,
    BorderRadius borderRadius = const BorderRadius.all(Radius.circular(12)),
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardColor = Theme.of(context).cardTheme.color ?? const Color(0xFF30302E);
    final titleColor = isDark ? Colors.white : Colors.black87;
    final subtitleColor = isDark ? Colors.white54 : Colors.black54;

    return Material(
      color: cardColor,
      borderRadius: borderRadius,
      child: InkWell(
        onTap: onTap,
        borderRadius: borderRadius,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 18.0, vertical: 14.0),
          child: Row(
            children: [
              Icon(
                icon,
                color: titleColor,
                size: 22,
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      title,
                      style: TextStyle(
                        color: titleColor,
                        fontSize: 16,
                      ),
                    ),
                    if (subtitle != null) ...[
                      const SizedBox(height: 2),
                      Text(
                        subtitle,
                        style: TextStyle(
                          color: subtitleColor,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showThemeDialog(BuildContext context, ThemeViewModel themeVM) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        final isDark = Theme.of(context).brightness == Brightness.dark;
        return AlertDialog(
          backgroundColor: isDark ? const Color(0xFF30302E) : Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          title: Text(
            'Modo de color',
            style: TextStyle(
              color: isDark ? Colors.white : Colors.black87,
              fontWeight: FontWeight.bold,
              fontSize: 18,
            ),
          ),
          contentPadding: const EdgeInsets.symmetric(vertical: 12),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildDialogOption(
                context: context,
                icon: Icons.settings_suggest_outlined,
                label: 'Sistema',
                isSelected: themeVM.themeMode == ThemeMode.system,
                onTap: () {
                  themeVM.setThemeMode(ThemeMode.system);
                  Navigator.pop(context);
                },
              ),
              _buildDialogOption(
                context: context,
                icon: Icons.light_mode_outlined,
                label: 'Claro',
                isSelected: themeVM.themeMode == ThemeMode.light,
                onTap: () {
                  themeVM.setThemeMode(ThemeMode.light);
                  Navigator.pop(context);
                },
              ),
              _buildDialogOption(
                context: context,
                icon: Icons.dark_mode_outlined,
                label: 'Oscuro',
                isSelected: themeVM.themeMode == ThemeMode.dark,
                onTap: () {
                  themeVM.setThemeMode(ThemeMode.dark);
                  Navigator.pop(context);
                },
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildDialogOption({
    required BuildContext context,
    required IconData icon,
    required String label,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
        child: Row(
          children: [
            Icon(
              icon,
              color: isSelected
                  ? const Color(0xFFAF6D58)
                  : (isDark ? Colors.white70 : Colors.black54),
              size: 24,
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Text(
                label,
                style: TextStyle(
                  color: isSelected
                      ? const Color(0xFFAF6D58)
                      : (isDark ? Colors.white : Colors.black87),
                  fontSize: 16,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                ),
              ),
            ),
            if (isSelected)
              const Icon(
                Icons.check,
                color: Color(0xFF3084D7),
                size: 20,
              ),
          ],
        ),
      ),
    );
  }
}
