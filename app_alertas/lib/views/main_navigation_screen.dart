import 'package:flutter/material.dart';
import 'package:app_alertas/views/map_screen.dart';
import 'package:app_alertas/views/create_alert_screen.dart';
import 'package:app_alertas/views/recent_activity_screen.dart';
import 'package:app_alertas/views/home_page.dart';
import 'package:app_alertas/models/alert_model.dart';

class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({super.key});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int currentIndex = 0;
  AlertModel? selectedAlert;
  
  final GlobalKey<MapScreenState> _mapKey = GlobalKey<MapScreenState>();
  final GlobalKey<CreateAlertScreenState> _createAlertKey = GlobalKey<CreateAlertScreenState>();
  final GlobalKey<RecentActivityScreenState> _recentActivityKey = GlobalKey<RecentActivityScreenState>();
  final GlobalKey<HomePageState> _homePageKey = GlobalKey<HomePageState>();

  late PageController _pageController;

  @override
  void initState() {
    super.initState();
    _pageController = PageController(initialPage: currentIndex);
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void navigateToMap(AlertModel alert) {
    setState(() {
      selectedAlert = alert;
      currentIndex = 0;
    });
    if (_pageController.hasClients) {
      _pageController.jumpToPage(0);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: PageView(
          controller: _pageController,
          physics: currentIndex == 0
              ? const NeverScrollableScrollPhysics() 
              : const BouncingScrollPhysics(),
          onPageChanged: (index) {
            if (index == 0) _mapKey.currentState?.reload();
            if (index == 1) _createAlertKey.currentState?.resetFields();
            if (index == 2) _recentActivityKey.currentState?.reload();
            if (index == 3) _homePageKey.currentState?.reload();
            setState(() => currentIndex = index);
          },
          children: [
            MapScreen(key: _mapKey, initialAlert: selectedAlert),
            CreateAlertScreen(
              key: _createAlertKey,
              onCreated: () {
                _homePageKey.currentState?.reload();
                setState(() => currentIndex = 3);
                if (_pageController.hasClients) {
                  _pageController.animateToPage(
                    3,
                    duration: const Duration(milliseconds: 300),
                    curve: Curves.easeInOut,
                  );
                }
              },
              onShowMap: navigateToMap,
            ),
            RecentActivityScreen(
              key: _recentActivityKey,
              onAlertTap: navigateToMap,
            ),
            HomePage(
              key: _homePageKey,
              onAlertTap: navigateToMap,
            ),
          ],
        ),
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: const Color(0xFF0D1015),
          border: Border(
            top: BorderSide(
              color: Colors.white.withValues(alpha: 0.12),
              width: 0.5,
            ),
          ),
        ),
        child: Theme(
          data: Theme.of(context).copyWith(
            splashColor: Colors.transparent,
            highlightColor: Colors.transparent,
            splashFactory: NoSplash.splashFactory,
          ),
          child: BottomNavigationBar(
            backgroundColor: Colors.transparent,
            elevation: 0,
            type: BottomNavigationBarType.fixed,
            currentIndex: currentIndex,
            selectedItemColor: Colors.white,
            unselectedItemColor: Colors.white.withValues(alpha: 0.38),
            selectedLabelStyle: const TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 11.5,
              letterSpacing: 0.4,
            ),
            unselectedLabelStyle: const TextStyle(
              fontWeight: FontWeight.normal,
              fontSize: 11,
              letterSpacing: 0.4,
            ),
            onTap: (index) {
              if (_pageController.hasClients) {
                _pageController.animateToPage(
                  index,
                  duration: const Duration(milliseconds: 250),
                  curve: Curves.easeInOut,
                );
              }
            },
            items: [
              BottomNavigationBarItem(
                icon: Icon(
                  currentIndex == 0 ? Icons.map_rounded : Icons.map_outlined,
                  size: currentIndex == 0 ? 23 : 22,
                ),
                label: 'Mapa',
              ),
              BottomNavigationBarItem(
                icon: Icon(
                  currentIndex == 1 ? Icons.add_circle_rounded : Icons.add_circle_outline_rounded,
                  size: currentIndex == 1 ? 23 : 22,
                  color: currentIndex == 1
                      ? const Color(0xFFEF4444)
                      : const Color(0xFFEF4444).withValues(alpha: 0.65),
                ),
                label: 'Crear',
              ),
              BottomNavigationBarItem(
                icon: Icon(
                  currentIndex == 2 ? Icons.notifications_rounded : Icons.notifications_none_rounded,
                  size: currentIndex == 2 ? 23 : 22,
                ),
                label: 'Alertas',
              ),
              BottomNavigationBarItem(
                icon: Icon(
                  currentIndex == 3 ? Icons.person_rounded : Icons.person_outline_rounded,
                  size: currentIndex == 3 ? 23 : 22,
                ),
                label: 'Perfil',
              ),
            ],
          ),
        ),
      ),
    );
  }
}
