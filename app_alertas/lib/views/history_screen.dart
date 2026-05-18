import 'package:flutter/material.dart';
import 'package:app_alertas/models/alert_model.dart';
import 'package:app_alertas/viewmodels/alert_viewmodel.dart';
import 'package:provider/provider.dart';
import 'package:app_alertas/viewmodels/auth_viewmodel.dart';
import 'package:app_alertas/views/alert_card.dart';

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});

  @override
  State<HistoryScreen> createState() => HistoryScreenState();
}

class HistoryScreenState extends State<HistoryScreen> {
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
    final alertVM = context.watch<AlertViewModel>();
    final myAlerts = alertVM.myAlerts;

    return Scaffold(
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 20, 24, 0),
              child: const Text(
                "Mis Reportes",
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
              child: alertVM.isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : RefreshIndicator(
                      onRefresh: () => reload(),
                      displacement: 20,
                      color: const Color(0xFF3B82F6),
                      child: myAlerts.isEmpty
                          ? ListView(
                              children: [
                                SizedBox(
                                  height: MediaQuery.of(context).size.height * 0.5,
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
                                ),
                              ],
                            )
                          : ListView.builder(
                              padding: EdgeInsets.zero,
                              itemCount: myAlerts.length,
                              itemBuilder: (context, index) => AlertCard(alert: myAlerts[index]),
                            ),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}




