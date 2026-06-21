import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:app_alertas/views/main_navigation_screen.dart';
import 'package:app_alertas/views/create_alert_screen.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final primaryColor = theme.primaryColor;
    final cardColor = theme.cardTheme.color ?? const Color(0xFF30302E);

    return Scaffold(
      // IMPORTANTE: Al usar un Scaffold sin AppBar, el body por defecto 
      // se extiende automáticamente detrás de la barra de estado.
      body: AnnotatedRegion<SystemUiOverlayStyle>(
        value: SystemUiOverlayStyle(
          statusBarColor: Colors.transparent, // Barra transparente
          statusBarIconBrightness: Theme.of(context).brightness == Brightness.dark
              ? Brightness.light
              : Brightness.dark, // Iconos adaptivos (Android)
          statusBarBrightness: Theme.of(context).brightness == Brightness.dark
              ? Brightness.dark
              : Brightness.light, // Iconos adaptivos (iOS)
        ),
        child: SingleChildScrollView(
          // Eliminamos cualquier padding por defecto que el scroll views pueda meter arriba
          padding: EdgeInsets.zero, 
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1. Contenedor Superior (Cabecera + Crea un reporte + Cámara)
              Container(
                width: double.infinity,
                decoration: BoxDecoration(
                  color: cardColor,
                  borderRadius: const BorderRadius.vertical(
                    bottom: Radius.circular(32),
                  ),
                ),
                padding: EdgeInsets.only(
                  // MediaQuery.paddingOf(context).top toma la altura exacta de la barra de estado
                  // Sumamos 24 para darle una separación elegante al texto principal
                  top: MediaQuery.paddingOf(context).top + 24,
                  left: 24,
                  right: 24,
                  bottom: 32,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Cabecera Principal
                    RichText(
                      text: TextSpan(
                        style: TextStyle(
                          fontSize: 32,
                          fontWeight: FontWeight.bold,
                          color: Theme.of(context).colorScheme.onSurface,
                          height: 1.2,
                        ),
                        children: [
                          const TextSpan(text: '¿Qué está\n'),
                          TextSpan(
                            text: 'sucediendo?',
                            style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5)),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 54),
                    // Etiqueta
                    Text(
                      'Crea un reporte',
                      style: TextStyle(
                        color: Theme.of(context).colorScheme.onSurface,
                        fontSize: 16,
                      ),
                    ),
                    const SizedBox(height: 16),
                    // Botón de cámara horizontal tipo píldora
                    GestureDetector(
                      onTap: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => CreateAlertScreen(
                              onCreated: () => Navigator.of(context).pop(),
                              onShowMap: (alert, {bool traceRoute = false}) {
                                Navigator.of(context).pop();
                                MainNavigationScreen.navigationKey.currentState?.navigateToMap(alert, traceRoute: traceRoute);
                              },
                            ),
                          ),
                        );
                      },
                      child: Container(
                        width: double.infinity,
                        height: 56,
                        decoration: BoxDecoration(
                          color: Theme.of(context).brightness == Brightness.dark
                              ? Colors.white
                              : const Color(0xFF30302E),
                          borderRadius: BorderRadius.circular(28),
                        ),
                        child: Center(
                          child: Icon(
                            Icons.camera_alt_rounded,
                            color: Theme.of(context).brightness == Brightness.dark
                                ? Colors.black
                                : Colors.white,
                            size: 26,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Contenido Inferior con Padding lateral
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // 2. Grilla de accesos: Navegar & Reportes
                    Row(
                      children: [
                        // Navegar (Izquierda)
                        Expanded(
                          child: GestureDetector(
                            onTap: () {
                              MainNavigationScreen.navigationKey.currentState?.selectTab(1);
                            },
                            child: Container(
                              height: 90,
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: cardColor,
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Icon(
                                    Icons.map_rounded,
                                    color: Theme.of(context).colorScheme.onSurface,
                                    size: 24,
                                  ),
                                  const Spacer(),
                                  Text(
                                    'Navegar',
                                    style: TextStyle(
                                      color: Theme.of(context).colorScheme.onSurface,
                                      fontSize: 15,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 16),
                        // Reportes (Derecha)
                        Expanded(
                          child: GestureDetector(
                            onTap: () {
                              MainNavigationScreen.navigationKey.currentState?.selectTab(2);
                            },
                            child: Container(
                              height: 90,
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: cardColor,
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Icon(
                                    Icons.question_answer_rounded,
                                    color: Theme.of(context).colorScheme.onSurface,
                                    size: 24,
                                  ),
                                  const Spacer(),
                                  Text(
                                    'Reportes',
                                    style: TextStyle(
                                      color: Theme.of(context).colorScheme.onSurface,
                                      fontSize: 15,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // 3. Banner informativo inferior
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: primaryColor.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(24),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  '¡Mantente informado!',
                                  style: TextStyle(
                                    color: Theme.of(context).colorScheme.onSurface,
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  'Consulta reportes locales y recibe alertas sobre incidentes cercanos.',
                                  style: TextStyle(
                                    color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.7),
                                    fontSize: 12,
                                    height: 1.4,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 16),
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: primaryColor.withValues(alpha: 0.2),
                              shape: BoxShape.circle,
                            ),
                            child: Icon(
                              Icons.shield_rounded,
                              color: primaryColor,
                              size: 24,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}