import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:app_alertas/views/theme/app_theme.dart';
import 'package:app_alertas/views/main_navigation_screen.dart';
import 'package:app_alertas/views/login_screen.dart';
import 'package:app_alertas/views/register_screen.dart';
import 'package:app_alertas/views/splash_screen.dart';
import 'package:app_alertas/viewmodels/auth_viewmodel.dart';
import 'package:app_alertas/viewmodels/alert_type_viewmodel.dart';
import 'package:app_alertas/viewmodels/alert_viewmodel.dart';

/// Raíz de la app (MaterialApp + tema + pantalla inicial).
class App extends StatefulWidget {
  const App({super.key});

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
  }

  @override
  void dispose() {
    _authProvider.dispose();
    super.dispose();
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
      ],
      child: Consumer<AuthViewModel>(
        builder: (context, auth, _) {
          return MaterialApp(
            debugShowCheckedModeBanner: false,
            theme: AppTheme.darkTheme,
            home: !auth.isInitialized
                ? const Scaffold(
                    body: Center(child: CircularProgressIndicator()),
                  )
                : auth.isAuthenticated
                    ? const MainNavigationScreen()
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
