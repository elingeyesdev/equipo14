import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:app_alertas/presentation/screens/map_screen.dart';
import 'package:app_alertas/presentation/screens/history_screen.dart';
import 'package:app_alertas/presentation/screens/create_alert_screen.dart';
import 'package:app_alertas/presentation/screens/notifications_screen.dart';
import 'package:app_alertas/presentation/providers/auth_provider.dart';
import 'package:app_alertas/presentation/screens/emergency_services_screen.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  int currentIndex = 0;
  final GlobalKey<HistoryScreenState> _historyKey =
      GlobalKey<HistoryScreenState>();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      resizeToAvoidBottomInset: false,
      body: SafeArea(
        child: [
          const MapScreen(),
          HistoryScreen(key: _historyKey),
          CreateAlertScreen(
            onCreated: () {
              _historyKey.currentState?.reload();
              setState(() => currentIndex = 1);
            },
          ),
          const NotificationsScreen(),
          const _ProfileScreen(),
        ][currentIndex],
      ),

      floatingActionButton: FloatingActionButton(
        backgroundColor: Colors.red,
        onPressed: () {
          setState(() {
            currentIndex = 2;
          });
        },
        child: const Icon(Icons.add, size: 30),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,

      bottomNavigationBar: BottomAppBar(
        color: const Color(0xFF020617),
        shape: const CircularNotchedRectangle(),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            IconButton(
              icon: Icon(
                Icons.map,
                color: currentIndex == 0
                    ? const Color(0xFF0F766E)
                    : Colors.white70,
              ),
              onPressed: () => setState(() => currentIndex = 0),
            ),
            IconButton(
              icon: Icon(
                Icons.history,
                color: currentIndex == 1
                    ? const Color(0xFF0F766E)
                    : Colors.white70,
              ),
              onPressed: () {
                _historyKey.currentState?.reload();
                setState(() => currentIndex = 1);
              },
            ),
            const SizedBox(width: 40),
            IconButton(
              icon: Icon(
                Icons.notifications,
                color: currentIndex == 3
                    ? const Color(0xFF0F766E)
                    : Colors.white70,
              ),
              onPressed: () => setState(() => currentIndex = 3),
            ),
            IconButton(
              icon: Icon(
                Icons.person,
                color: currentIndex == 4
                    ? const Color(0xFF0F766E)
                    : Colors.white70,
              ),
              onPressed: () => setState(() => currentIndex = 4),
            ),
          ],
        ),
      ),
    );
  }
}

class _ProfileScreen extends StatelessWidget {
  const _ProfileScreen();

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.user;
    if (user == null) {
      return const Center(child: CircularProgressIndicator());
    }

    final roleName = (user.roleName ?? '').toLowerCase();
    final isService = roleName == 'services';
    final fullName = '${user.firstName} ${user.lastName}'.trim();
    final initials = _initials(user.firstName, user.lastName);

    return SingleChildScrollView(
      padding: const EdgeInsets.only(left: 20, right: 20, top: 18, bottom: 28),
      child: Column(
        children: [
          Center(
            child: Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: const LinearGradient(
                  colors: [Color(0xFF0F766E), Color(0xFF134E4A)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF0F766E).withOpacity(0.4),
                    blurRadius: 20,
                    spreadRadius: 2,
                  ),
                ],
              ),
              child: Center(
                child: Text(
                  initials,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 36,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1,
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),

          Text(
            fullName,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 22,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 6),

          if (isService)
            Container(
              margin: const EdgeInsets.only(top: 4, bottom: 4),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
              decoration: BoxDecoration(
                color: const Color(0xFF0F766E).withOpacity(0.2),
                border: Border.all(color: const Color(0xFF0F766E), width: 1.2),
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Text(
                'Proveedor de Servicios',
                style: TextStyle(
                  color: Color(0xFF5EEAD4),
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),

          const SizedBox(height: 28),

          _InfoCard(
            children: [
              _InfoRow(
                icon: Icons.person_outline,
                label: 'Nombre',
                value: fullName,
              ),
              const _RowDivider(),
              _InfoRow(
                icon: Icons.phone_outlined,
                label: 'Teléfono',
                value: user.phone ?? '—',
              ),
              if (user.roleName != null) ...[
                const _RowDivider(),
                _InfoRow(
                  icon: Icons.badge_outlined,
                  label: 'Rol',
                  value: user.roleName!,
                ),
              ],
            ],
          ),

          const SizedBox(height: 20),

          _ActionButton(
            icon: Icons.local_hospital_outlined,
            label: 'Servicios de Emergencia',
            color: const Color(0xFF0F766E),
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => const EmergencyServicesScreen(),
                ),
              );
            },
          ),
          const SizedBox(height: 12),

          // ── Logout button ──
          _ActionButton(
            icon: Icons.logout,
            label: 'Cerrar sesión',
            color: Colors.red.shade700,
            onPressed: () async {
              await auth.logout();
            },
          ),

          const SizedBox(height: 24),
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

class _InfoCard extends StatelessWidget {
  final List<Widget> children;
  const _InfoCard({required this.children});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF1E293B), width: 1),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.3),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Column(children: children),
      ),
    );
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
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
      child: Row(
        children: [
          Icon(icon, color: const Color(0xFF0F766E), size: 22),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    color: Color(0xFF94A3B8),
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                    letterSpacing: 0.5,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 15,
                    fontWeight: FontWeight.w500,
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

class _RowDivider extends StatelessWidget {
  const _RowDivider();

  @override
  Widget build(BuildContext context) {
    return const Divider(height: 1, color: Color(0xFF1E293B), indent: 54);
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
      child: OutlinedButton.icon(
        style: OutlinedButton.styleFrom(
          foregroundColor: Colors.white,
          side: BorderSide(color: color, width: 1.4),
          backgroundColor: color.withOpacity(0.1),
          padding: const EdgeInsets.symmetric(vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        icon: Icon(icon, color: color, size: 20),
        label: Text(
          label,
          style: TextStyle(
            color: color,
            fontWeight: FontWeight.w600,
            fontSize: 15,
          ),
        ),
        onPressed: onPressed,
      ),
    );
  }
}
