import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_foreground_task/flutter_foreground_task.dart';
import 'package:app_alertas/views/theme/app_theme.dart';
import 'package:app_alertas/views/main_navigation_screen.dart';
import 'package:app_alertas/views/login_screen.dart';
import 'package:app_alertas/views/register_screen.dart';
import 'package:app_alertas/views/splash_screen.dart';
import 'package:app_alertas/models/alert_model.dart';
import 'package:app_alertas/viewmodels/auth_viewmodel.dart';
import 'package:app_alertas/viewmodels/alert_type_viewmodel.dart';
import 'package:app_alertas/viewmodels/alert_viewmodel.dart';
import 'package:app_alertas/viewmodels/comment_viewmodel.dart';
import 'package:app_alertas/viewmodels/tracking_provider.dart';

/// Raíz de la app (MaterialApp + tema + pantalla inicial).
class App extends StatefulWidget {
  const App({super.key});

  static final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

  @override
  State<App> createState() => _AppState();
}

class _AppState extends State<App> {
  final AuthViewModel _authProvider = AuthViewModel();
  bool _splashFinished = false;

  @override
  void initState() {
    super.initState();
    _authProvider.initializeSession();
    FlutterForegroundTask.addTaskDataCallback(_onReceiveTaskData);
  }

  @override
  void dispose() {
    _authProvider.dispose();
    FlutterForegroundTask.removeTaskDataCallback(_onReceiveTaskData);
    super.dispose();
  }

  void _onReceiveTaskData(dynamic data) {
    if (data == 'navigate_to_map_route') {
      final context = App.navigatorKey.currentContext;
      if (context != null) {
        final trackingProvider = Provider.of<TrackingProvider>(context, listen: false);
        if (trackingProvider.isFollowingRoute &&
            trackingProvider.incidentLatitude != null &&
            trackingProvider.incidentLongitude != null) {
          final alertVM = Provider.of<AlertViewModel>(context, listen: false);
          final alert = alertVM.alerts.firstWhere(
            (a) => a.coordinates.length >= 2 &&
                   a.coordinates[1] == trackingProvider.incidentLatitude &&
                   a.coordinates[0] == trackingProvider.incidentLongitude,
            orElse: () => AlertModel(
              id: 0,
              userId: '',
              type: trackingProvider.incidentType ?? '',
              description: trackingProvider.incidentDescription ?? '',
              coordinates: [trackingProvider.incidentLongitude!, trackingProvider.incidentLatitude!],
              weight: 0.0,
              verified: false,
              images: const [],
              zone: '',
              createdAt: DateTime.now(),
            ),
          );
          MainNavigationScreen.navigationKey.currentState?.navigateToMap(alert, traceRoute: true);
        }
      }
    }
  }

  void _onSplashFinish() {
    if (mounted) {
      setState(() {
        _splashFinished = true;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider<AuthViewModel>.value(value: _authProvider),
        ChangeNotifierProvider<AlertTypeViewModel>(
          create: (_) => AlertTypeViewModel()..fetchAlertTypes(),
        ),
        ChangeNotifierProvider<AlertViewModel>(
          create: (_) => AlertViewModel()..fetchAlerts(),
        ),
        ChangeNotifierProvider<CommentViewModel>(
          create: (_) => CommentViewModel(),
        ),
        ChangeNotifierProvider<TrackingProvider>(
          create: (_) => TrackingProvider(),
        ),
      ],
      child: Consumer<AuthViewModel>(
        builder: (context, auth, _) {
          return MaterialApp(
            navigatorKey: App.navigatorKey,
            debugShowCheckedModeBanner: false,
            theme: AppTheme.darkTheme,
            home: !auth.isInitialized
                ? const Scaffold(
                    body: Center(child: CircularProgressIndicator()),
                  )
                : auth.isAuthenticated
                    ? MainNavigationScreen(key: MainNavigationScreen.navigationKey)
                    : !_splashFinished
                        ? SplashScreen(onFinish: _onSplashFinish)
                        : LoginScreen(
                            onGoToRegister: () => Navigator.of(context).push(
                              MaterialPageRoute(builder: (_) => const RegisterScreen()),
                            ),
                          ),
          );
        },
      ),
    );
  }
}
