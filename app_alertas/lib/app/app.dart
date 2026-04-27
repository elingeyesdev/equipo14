import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:app_alertas/presentation/theme/app_theme.dart';
import 'package:app_alertas/presentation/screens/home_page.dart';
import 'package:app_alertas/presentation/screens/login_screen.dart';
import 'package:app_alertas/presentation/screens/register_screen.dart';
import 'package:app_alertas/presentation/providers/auth_provider.dart';

/// Raíz de la app (MaterialApp + tema + pantalla inicial).
class App extends StatefulWidget {
  const App({super.key});

  @override
  State<App> createState() => _AppState();
}

class _AppState extends State<App> {
  final AuthProvider _authProvider = AuthProvider();

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

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider<AuthProvider>.value(
      value: _authProvider,
      child: Consumer<AuthProvider>(
        builder: (context, auth, _) {
          return MaterialApp(
            debugShowCheckedModeBanner: false,
            theme: AppTheme.darkTheme,
            home: !auth.isInitialized
                ? const Scaffold(
                    body: Center(child: CircularProgressIndicator()),
                  )
                : auth.isAuthenticated
                ? const HomePage()
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
