import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:app_alertas/views/map_screen.dart';
import 'package:app_alertas/views/history_screen.dart';
import 'package:app_alertas/views/create_alert_screen.dart';
import 'package:app_alertas/views/recent_activity_screen.dart';
import 'package:app_alertas/viewmodels/auth_viewmodel.dart';
import 'package:app_alertas/views/emergency_services_screen.dart';
import 'package:app_alertas/models/alert_model.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  int currentIndex = 0;
  AlertModel? selectedAlert;
  final GlobalKey<HistoryScreenState> _historyKey =
      GlobalKey<HistoryScreenState>();
  final GlobalKey<MapScreenState> _mapKey = GlobalKey<MapScreenState>();
  final GlobalKey<RecentActivityScreenState> _recentActivityKey =
      GlobalKey<RecentActivityScreenState>();
  final GlobalKey<CreateAlertScreenState> _createAlertKey =
      GlobalKey<CreateAlertScreenState>();

  late PageController _pageController;

  @override
  void initState() {
    super.initState();
    _pageController = PageController(initialPage: currentIndex);
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void navigateToMap(AlertModel alert) {
    setState(() {
      selectedAlert = alert;
      currentIndex = 0;
    });
    if (_pageController.hasClients) {
      _pageController.jumpToPage(0);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: PageView(
          controller: _pageController,
          physics: currentIndex == 0
              ? const NeverScrollableScrollPhysics() // Desactivar swipe en el mapa para poder moverlo libremente
              : const BouncingScrollPhysics(),
          onPageChanged: (index) {
            if (index == 0) _mapKey.currentState?.reload();
            if (index == 1) _historyKey.currentState?.reload();
            if (index == 2) _createAlertKey.currentState?.resetFields();
            if (index == 3) _recentActivityKey.currentState?.reload();
            setState(() => currentIndex = index);
          },
          children: [
            MapScreen(key: _mapKey, initialAlert: selectedAlert),
            HistoryScreen(key: _historyKey),
            CreateAlertScreen(
              key: _createAlertKey,
              onCreated: () {
                // Solo recargamos el historial ya que el usuario es redirigido allí.
                _historyKey.currentState?.reload();
                setState(() => currentIndex = 1);
                if (_pageController.hasClients) {
                  _pageController.animateToPage(
                    1,
                    duration: const Duration(milliseconds: 300),
                    curve: Curves.easeInOut,
                  );
                }
              },
              onShowMap: navigateToMap,
            ),
            RecentActivityScreen(
              key: _recentActivityKey,
              onAlertTap: navigateToMap,
            ),
            const _ProfileScreen(),
          ],
        ),
      ),

      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: const Color(0xFF0D1015),
          border: Border(
            top: BorderSide(
              color: Colors.white.withValues(alpha: 0.12),
              width: 0.5,
            ),
          ),
        ),
        child: Theme(
          data: Theme.of(context).copyWith(
            splashColor: Colors.transparent,
            highlightColor: Colors.transparent,
            splashFactory: NoSplash.splashFactory,
          ),
          child: BottomNavigationBar(
            backgroundColor: Colors.transparent,
            elevation: 0,
            type: BottomNavigationBarType.fixed,
            currentIndex: currentIndex,
            selectedItemColor: Colors.white,
            unselectedItemColor: Colors.white.withValues(alpha: 0.38),
            selectedLabelStyle: const TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 11.5,
              letterSpacing: 0.4,
            ),
            unselectedLabelStyle: const TextStyle(
              fontWeight: FontWeight.normal,
              fontSize: 11,
              letterSpacing: 0.4,
            ),
            onTap: (index) {
              if (_pageController.hasClients) {
                _pageController.animateToPage(
                  index,
                  duration: const Duration(milliseconds: 250),
                  curve: Curves.easeInOut,
                );
              }
            },
            items: [
              BottomNavigationBarItem(
                icon: Icon(
                  currentIndex == 0 ? Icons.map_rounded : Icons.map_outlined,
                  size: currentIndex == 0 ? 23 : 22,
                ),
                label: 'Mapa',
              ),
              BottomNavigationBarItem(
                icon: Icon(
                  currentIndex == 1 ? Icons.assignment_rounded : Icons.assignment_outlined,
                  size: currentIndex == 1 ? 23 : 22,
                ),
                label: 'Mis Reportes',
              ),
              BottomNavigationBarItem(
                icon: Icon(
                  currentIndex == 2 ? Icons.add_circle_rounded : Icons.add_circle_outline_rounded,
                  size: currentIndex == 2 ? 23 : 22,
                  color: currentIndex == 2
                      ? const Color(0xFFEF4444)
                      : const Color(0xFFEF4444).withValues(alpha: 0.65),
                ),
                label: 'Crear',
              ),
              BottomNavigationBarItem(
                icon: Icon(
                  currentIndex == 3 ? Icons.notifications_rounded : Icons.notifications_none_rounded,
                  size: currentIndex == 3 ? 23 : 22,
                ),
                label: 'Alertas',
              ),
              BottomNavigationBarItem(
                icon: Icon(
                  currentIndex == 4 ? Icons.person_rounded : Icons.person_outline_rounded,
                  size: currentIndex == 4 ? 23 : 22,
                ),
                label: 'Perfil',
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ProfileScreen extends StatelessWidget {
  const _ProfileScreen();

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthViewModel>();
    final user = auth.user;
    if (user == null) {
      return const Center(child: CircularProgressIndicator());
    }

    final fullName = '${user.firstName} ${user.lastName}'.trim();
    final initials = _initials(user.firstName, user.lastName);

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Section
          Center(
            child: Container(
              width: 90,
              height: 90,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                color: Color(0xFF26292E),
              ),
              child: Center(
                child: Text(
                  initials,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 28,
                    fontWeight: FontWeight.w300,
                    letterSpacing: 1.5,
                  ),
                ),
              ),
            ),
          ),

          const SizedBox(height: 40),

          // Section 1: CUENTA
          const Text(
            'CUENTA',
            style: TextStyle(
              color: Color(0xFF64748B),
              fontSize: 11,
              fontWeight: FontWeight.bold,
              letterSpacing: 1.2,
            ),
          ),
          const SizedBox(height: 8),

          _InfoRow(
            icon: Icons.person_outline,
            label: 'NOMBRE COMPLETO',
            value: fullName,
          ),
          const Divider(height: 1, color: Color(0xFF26292E)),
          _InfoRow(
            icon: Icons.phone_outlined,
            label: 'TELÉFONO',
            value: user.phone,
          ),
          if (user.roleName != null) ...[
            const Divider(height: 1, color: Color(0xFF26292E)),
            _InfoRow(
              icon: Icons.badge_outlined,
              label: 'ROL DEL SISTEMA',
              value: user.roleName!,
            ),
          ],
          const Divider(height: 1, color: Color(0xFF26292E)),

          const SizedBox(height: 36),

          // Section 2: OPCIONES Y SEGURIDAD
          const Text(
            'OPCIONES Y SEGURIDAD',
            style: TextStyle(
              color: Color(0xFF64748B),
              fontSize: 11,
              fontWeight: FontWeight.bold,
              letterSpacing: 1.2,
            ),
          ),
          const SizedBox(height: 16),

          _ActionButton(
            icon: Icons.local_hospital_outlined,
            label: 'Servicios de Emergencia',
            color: const Color(0xFF3B82F6),
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => const EmergencyServicesScreen(),
                ),
              );
            },
          ),
          const SizedBox(height: 12),
          _ActionButton(
            icon: Icons.logout,
            label: 'Cerrar sesión',
            color: const Color(0xFFEF4444),
            onPressed: () async {
              await auth.logout();
            },
          ),

          const SizedBox(height: 32),
        ],
      ),
    );
  }

  String _initials(String? first, String? last) {
    final f = (first?.isNotEmpty == true) ? first![0].toUpperCase() : '';
    final l = (last?.isNotEmpty == true) ? last![0].toUpperCase() : '';
    return '$f$l';
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  const _InfoRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 14),
      child: Row(
        children: [
          Icon(icon, color: Colors.white, size: 22),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    color: Color(0xFF64748B),
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.0,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  value,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 15,
                    fontWeight: FontWeight.normal,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onPressed;

  const _ActionButton({
    required this.icon,
    required this.label,
    required this.color,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton.icon(
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF26292E),
          foregroundColor: color,
          elevation: 0,
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: const RoundedRectangleBorder(
            borderRadius: BorderRadius.zero,
          ),
        ),
        icon: Icon(icon, color: color, size: 20),
        label: Text(
          label.toUpperCase(),
          style: TextStyle(
            color: color,
            fontWeight: FontWeight.bold,
            fontSize: 12,
            letterSpacing: 1.0,
          ),
        ),
        onPressed: onPressed,
      ),
    );
  }
}



