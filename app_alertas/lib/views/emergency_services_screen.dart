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
      color: Color(0xFF506E96),
    ),
    _EmergencyService(
      icon: Icons.medical_services_rounded,
      title: 'SEDES',
      subtitle: 'Coordinación de ambulancias y traslados.',
      phone: '168',
      color: Color(0xFF3C8C6E),
    ),
    _EmergencyService(
      icon: Icons.local_fire_department_rounded,
      title: 'Bomberos',
      subtitle: 'Control y respuesta ante incendios',
      phone: '119',
      color: Color(0xFFAA5F3C),
    ),
    _EmergencyService(
      icon: Icons.security_rounded,
      title: 'Defensa Civil',
      subtitle: 'Gestión de desastres y catástrofes',
      phone: '800148139',
      color: Color(0xFFAA8C3C),
    ),
    _EmergencyService(
      icon: Icons.health_and_safety_rounded,
      title: 'COEM',
      subtitle: 'Emergencias municipales',
      phone: '800125700',
      color: Color(0xFFAA5F82),
    ),
    _EmergencyService(
      icon: Icons.directions_car_rounded,
      title: 'Tránsito',
      subtitle: 'Accidentes viales y control de tráfico',
      phone: '110',
      color: Color(0xFF785FAA),
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final onSurface = Theme.of(context).colorScheme.onSurface;
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
                    icon: Icon(Icons.arrow_back, color: onSurface),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    "Servicios de Emergencia",
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.normal,
                      letterSpacing: -0.3,
                      color: onSurface,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            // Banner informativo
            Container(
              margin: const EdgeInsets.fromLTRB(16, 8, 16, 4),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFFB64D4C).withValues(alpha: 0.4),
              borderRadius: BorderRadius.circular(14),
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
                      color: Colors.white.withValues(alpha: 0.85),
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
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              itemCount: _services.length,
              separatorBuilder: (context, index) => Divider(
                color: Theme.of(context).brightness == Brightness.dark
                    ? Colors.white.withValues(alpha: 0.08)
                    : Colors.black.withValues(alpha: 0.08),
                height: 24,
                thickness: 0.5,
              ),
              itemBuilder: (context, index) {
                return _EmergencyCard(service: _services[index]);
              },
            ),
          ),
        ],
      ),
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
    try {
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri);
      } else {
        // Intentar lanzar directamente en caso de que canLaunchUrl diga falso (común en HyperOS/MIUI)
        await launchUrl(uri);
      }
    } catch (e) {
      // Si falla, al menos no detiene la ejecución
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 6),
      child: Row(
        children: [
          // Ícono del servicio (completamente libre, sin recuadros)
          Icon(
            service.icon,
            color: service.color,
            size: 30,
          ),
          const SizedBox(width: 16),

          // Nombre y descripción
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  service.title,
                  style: TextStyle(
                    color: Theme.of(context).colorScheme.onSurface,
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  service.subtitle,
                  style: TextStyle(
                    color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6),
                    fontSize: 12.5,
                  ),
                ),
                const SizedBox(height: 6),
                // Número visible
                Row(
                  children: [
                    Icon(
                      Icons.phone_rounded,
                      size: 13,
                      color: service.color.withValues(alpha: 0.8),
                    ),
                    const SizedBox(width: 5),
                    Text(
                      service.phone,
                      style: TextStyle(
                        color: service.color,
                        fontSize: 13.5,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.1,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Botón de llamada circular y limpio (sin recuadros)
          GestureDetector(
            onTap: _call,
            child: Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: service.color.withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.phone_rounded,
                color: service.color,
                size: 20,
              ),
            ),
          ),
        ],
      ),
    );
  }
}



