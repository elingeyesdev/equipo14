import 'package:flutter/material.dart';

class EmergencyServicesScreen extends StatelessWidget {
  const EmergencyServicesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Servicios de Emergencia')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: const [
          _EmergencyCard(
            icon: Icons.local_police_outlined,
            title: 'Policia',
            subtitle: 'Coordinacion de incidentes de seguridad.',
          ),
          SizedBox(height: 12),
          _EmergencyCard(
            icon: Icons.local_hospital_outlined,
            title: 'Salud y ambulancias',
            subtitle: 'Atencion medica prehospitalaria.',
          ),
          SizedBox(height: 12),
          _EmergencyCard(
            icon: Icons.local_fire_department_outlined,
            title: 'Bomberos',
            subtitle: 'Control y respuesta ante incendios.',
          ),
        ],
      ),
    );
  }
}

class _EmergencyCard extends StatelessWidget {
  const _EmergencyCard({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        leading: Icon(icon),
        title: Text(title),
        subtitle: Text(subtitle),
      ),
    );
  }
}
