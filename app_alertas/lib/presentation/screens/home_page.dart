import 'package:flutter/material.dart';
import 'package:app_alertas/presentation/screens/map_screen.dart';
import 'package:app_alertas/presentation/screens/history_screen.dart';
import 'package:app_alertas/presentation/screens/create_alert_screen.dart';
import 'package:app_alertas/presentation/screens/notifications_screen.dart';

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
            IconButton(icon: const Icon(Icons.person), onPressed: () {}),
          ],
        ),
      ),
    );
  }
}
