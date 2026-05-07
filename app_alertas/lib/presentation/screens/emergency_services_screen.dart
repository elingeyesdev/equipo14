import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

class EmergencyServicesScreen extends StatelessWidget {
  const EmergencyServicesScreen({super.key});

  static const _services = [
    _EmergencyService(
      icon: Icons.local_police_rounded,
      title: 'Policía Nacional',
      subtitle: 'Coordinación de incidentes de seguridad',
      phone: '110',
      color: Color(0xFF3B82F6),
    ),
    _EmergencyService(
      icon: Icons.local_hospital_rounded,
      title: 'Ambulancias (SEDES)',
      subtitle: 'Atención médica prehospitalaria',
      phone: '165',
      color: Color(0xFF10B981),
    ),
    _EmergencyService(
      icon: Icons.local_fire_department_rounded,
      title: 'Bomberos',
      subtitle: 'Control y respuesta ante incendios',
      phone: '119',
      color: Color(0xFFF97316),
    ),
    _EmergencyService(
      icon: Icons.security_rounded,
      title: 'Defensa Civil',
      subtitle: 'Gestión de desastres y catástrofes',
      phone: '800100123',
      color: Color(0xFFEAB308),
    ),
    _EmergencyService(
      icon: Icons.health_and_safety_rounded,
      title: 'Hospital San Juan de Dios',
      subtitle: 'Emergencias hospitalarias Santa Cruz',
      phone: '3362272',
      color: Color(0xFFEC4899),
    ),
    _EmergencyService(
      icon: Icons.directions_car_rounded,
      title: 'Tránsito',
      subtitle: 'Accidentes viales y control de tráfico',
      phone: '1450',
      color: Color(0xFF8B5CF6),
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F172A),
        elevation: 0,
        title: const Text(
          'Servicios de Emergencia',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Banner informativo
          Container(
            margin: const EdgeInsets.fromLTRB(16, 8, 16, 4),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFFEF4444).withOpacity(0.12),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: const Color(0xFFEF4444).withOpacity(0.3),
              ),
            ),
            child: Row(
              children: [
                const Icon(Icons.info_outline_rounded,
                    color: Color(0xFFEF4444), size: 20),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Toca el botón de llamada para contactar directamente al servicio.',
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.85),
                      fontSize: 13,
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Lista de servicios
          Expanded(
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: _services.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                return _EmergencyCard(service: _services[index]);
              },
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Modelo de datos ─────────────────────────────────────────────────────────

class _EmergencyService {
  const _EmergencyService({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.phone,
    required this.color,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final String phone;
  final Color color;
}

// ─── Tarjeta de servicio ──────────────────────────────────────────────────────

class _EmergencyCard extends StatelessWidget {
  const _EmergencyCard({required this.service});

  final _EmergencyService service;

  Future<void> _call() async {
    final uri = Uri(scheme: 'tel', path: service.phone);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: Colors.white.withOpacity(0.06),
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            // Ícono del servicio
            Container(
              width: 50,
              height: 50,
              decoration: BoxDecoration(
                color: service.color.withOpacity(0.15),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(service.icon, color: service.color, size: 26),
            ),
            const SizedBox(width: 14),

            // Nombre y descripción
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    service.title,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    service.subtitle,
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.5),
                      fontSize: 12,
                    ),
                  ),
                  const SizedBox(height: 6),
                  // Número visible
                  Row(
                    children: [
                      Icon(Icons.phone_rounded,
                          size: 13,
                          color: service.color.withOpacity(0.8)),
                      const SizedBox(width: 4),
                      Text(
                        service.phone,
                        style: TextStyle(
                          color: service.color,
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1.1,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // Botón de llamada
            GestureDetector(
              onTap: _call,
              child: Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: service.color,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: service.color.withOpacity(0.35),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: const Icon(
                  Icons.phone_rounded,
                  color: Colors.white,
                  size: 20,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
