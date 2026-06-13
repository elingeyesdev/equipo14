import 'package:flutter/material.dart';
import 'package:app_alertas/views/home_screen.dart';
import 'package:app_alertas/views/map_screen.dart';
import 'package:app_alertas/views/recent_activity_screen.dart';
import 'package:app_alertas/views/profile_page.dart';
import 'package:app_alertas/models/alert_model.dart';
import 'package:provider/provider.dart';
import 'package:app_alertas/viewmodels/alert_viewmodel.dart';
import 'package:app_alertas/viewmodels/auth_viewmodel.dart';
import 'package:app_alertas/core/utils/role_utils.dart';

class MainNavigationScreen extends StatefulWidget {
  static final GlobalKey<MainNavigationScreenState> navigationKey = GlobalKey<MainNavigationScreenState>();
  const MainNavigationScreen({super.key});

  @override
  State<MainNavigationScreen> createState() => MainNavigationScreenState();
}

class MainNavigationScreenState extends State<MainNavigationScreen> {
  int currentIndex = 0;
  AlertModel? selectedAlert;
  bool traceRouteOnMap = false;
  
  final GlobalKey<MapScreenState> _mapKey = GlobalKey<MapScreenState>();
  final GlobalKey<RecentActivityScreenState> _recentActivityKey = GlobalKey<RecentActivityScreenState>();
  final GlobalKey<ProfilePageState> _profilePageKey = GlobalKey<ProfilePageState>();

  late PageController _pageController;

  @override
  void initState() {
    super.initState();
    _pageController = PageController(initialPage: currentIndex);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final auth = context.read<AuthViewModel>();
      context.read<AlertViewModel>().fetchAlerts(
            includeDeleted: isStaffRole(auth.user?.roleId, auth.user?.roleName),
          );
    });
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void navigateToMap(AlertModel alert, {bool traceRoute = false}) {
    setState(() {
      selectedAlert = alert;
      traceRouteOnMap = traceRoute;
      currentIndex = 1;
    });
    if (_pageController.hasClients) {
      _pageController.jumpToPage(1);
    }
  }

  void selectTab(int index) {
    setState(() {
      currentIndex = index;
    });
    if (_pageController.hasClients) {
      _pageController.jumpToPage(index);
    }
  }

  Widget _buildNavItem(int index, IconData activeIcon, IconData inactiveIcon, String label, {bool isCoffee = false}) {
    final isSelected = currentIndex == index;
    final Color itemColor;
    if (isCoffee) {
      itemColor = isSelected ? const Color(0xFFB45F4B) : const Color(0xFFB45F4B).withValues(alpha: 0.65);
    } else {
      itemColor = isSelected ? Colors.white : Colors.white.withValues(alpha: 0.38);
    }

    return Expanded(
      child: InkWell(
        onTap: () => selectTab(index),
        splashColor: Colors.transparent,
        highlightColor: Colors.transparent,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              isSelected ? activeIcon : inactiveIcon,
              color: itemColor,
              size: isSelected ? 23 : 22,
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                color: itemColor,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                fontSize: isSelected ? 11.5 : 11,
                letterSpacing: 0.4,
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      // SE ELIMINÓ EL SAFEAREA DE AQUÍ PARA PERMITIR QUE LAS PESTAÑAS USEN TODO EL ESPACIO DE LA PANTALLA
      body: PageView(
        controller: _pageController,
        physics: const NeverScrollableScrollPhysics(),
        onPageChanged: (index) {
          if (index == 1) _mapKey.currentState?.reload();
          if (index == 2) _recentActivityKey.currentState?.reload();
          if (index == 3) _profilePageKey.currentState?.reload();
          setState(() {
            currentIndex = index;
            if (index != 1) {
              traceRouteOnMap = false;
            }
          });
        },
        children: [
          const HomeScreen(), // Ya maneja internamente su propio espaciado superior manual
          MapScreen(
            key: _mapKey,
            initialAlert: selectedAlert,
            shouldTraceRoute: traceRouteOnMap,
          ),
          RecentActivityScreen(
            key: _recentActivityKey,
            onAlertTap: (alert, {bool traceRoute = false}) {
              navigateToMap(alert, traceRoute: traceRoute);
            },
          ),
          ProfilePage(
            key: _profilePageKey,
            onAlertTap: navigateToMap,
          ),
        ],
      ),
      bottomNavigationBar: Container(
        height: 60 + MediaQuery.paddingOf(context).bottom,
        decoration: BoxDecoration(
          color: const Color(0xFF262624),
          border: Border(
            top: BorderSide(
              color: Colors.white.withValues(alpha: 0.12),
              width: 0.5,
            ),
          ),
        ),
        padding: EdgeInsets.only(bottom: MediaQuery.paddingOf(context).bottom),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            _buildNavItem(0, Icons.home_rounded, Icons.home_outlined, 'Inicio', isCoffee: true),
            _buildNavItem(1, Icons.map_rounded, Icons.map_outlined, 'Mapa'),
            _buildNavItem(2, Icons.question_answer_rounded, Icons.question_answer_rounded, 'Alertas'),
            _buildNavItem(3, Icons.person_rounded, Icons.person_outline_rounded, 'Perfil'),
          ],
        ),
      ),
    );
  }
}