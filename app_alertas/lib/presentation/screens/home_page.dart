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

  void _showProfileDialog() {
    final auth = context.read<AuthProvider>();
    final user = auth.user;
    if (user == null) return;
    final roleName = (user.roleName ?? '').toLowerCase();
    final isService = roleName == 'service';

    showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Perfil'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Nombre: ${user.firstName} ${user.lastName}'),
            const SizedBox(height: 6),
            Text('Telefono: ${user.phone}'),
            if (isService) ...[
              const SizedBox(height: 10),
              const Chip(
                label: Text('Proveedor de Servicios'),
                backgroundColor: Color(0xFF0F766E),
              ),
            ],
          ],
        ),
        actions: [
          if (isService)
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => const EmergencyServicesScreen(),
                  ),
                );
              },
              child: const Text('Servicios de emergencia'),
            ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cerrar'),
          ),
          FilledButton(
            onPressed: () async {
              Navigator.of(context).pop();
              await auth.logout();
            },
            child: const Text('Cerrar sesion'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    final roleName = (user?.roleName ?? '').toLowerCase();
    final isService = roleName == 'service';

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('${user?.firstName ?? ''} ${user?.lastName ?? ''}'.trim()),
            Text(
              user?.phone ?? '',
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ],
        ),
        actions: [
          if (isService)
            const Padding(
              padding: EdgeInsets.only(right: 12),
              child: Center(
                child: Chip(
                  label: Text('Proveedor de Servicios'),
                  backgroundColor: Color(0xFF0F766E),
                ),
              ),
            ),
        ],
      ),
      body: [
        const MapScreen(),
        HistoryScreen(key: _historyKey),
        CreateAlertScreen(
          onCreated: () {
            _historyKey.currentState?.reload();
            setState(() => currentIndex = 1);
          },
        ),
        const NotificationsScreen(),
      ][currentIndex],

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
              icon: const Icon(Icons.map),
              onPressed: () => setState(() => currentIndex = 0),
            ),
            IconButton(
              icon: const Icon(Icons.history),
              onPressed: () {
                _historyKey.currentState?.reload();
                setState(() => currentIndex = 1);
              },
            ),
            const SizedBox(width: 40),
            IconButton(
              icon: const Icon(Icons.notifications),
              onPressed: () => setState(() => currentIndex = 3),
            ),
            IconButton(
              icon: const Icon(Icons.person),
              onPressed: _showProfileDialog,
            ),
          ],
        ),
      ),
    );
  }
}
