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
      context.read<AlertViewModel>().fetchAlerts();
    });
  }

  Future<void> reload() async {
    await context.read<AlertViewModel>().fetchAlerts();
  }

  @override
  Widget build(BuildContext context) {
    final alertVM = context.watch<AlertViewModel>();
    final user = context.watch<AuthViewModel>().user;
    final myAlerts = alertVM.alerts.where((a) => a.userId == user?.id).toList();

    return Scaffold(
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 20, 24, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    "Mis Reportes",
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.w900,
                      letterSpacing: -0.5,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    "Revisa los incidentes que has reportado",
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.5),
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            Expanded(
              child: alertVM.isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : RefreshIndicator(
                      onRefresh: () => alertVM.fetchAlerts(),
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
                              padding: const EdgeInsets.symmetric(horizontal: 20),
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




