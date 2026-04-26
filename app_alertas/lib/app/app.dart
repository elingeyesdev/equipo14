import 'package:flutter/material.dart';
import 'package:app_alertas/data/models/user_model.dart';
import 'package:app_alertas/presentation/theme/app_theme.dart';
import 'package:app_alertas/presentation/screens/authority_login_screen.dart';
import 'package:app_alertas/presentation/screens/authority_register_screen.dart';
import 'package:app_alertas/presentation/screens/home_page.dart';
import 'package:app_alertas/presentation/screens/login_screen.dart';
import 'package:app_alertas/presentation/screens/register_screen.dart';

/// Raíz de la app (MaterialApp + tema + pantalla inicial).
class App extends StatefulWidget {
  const App({super.key});

  @override
  State<App> createState() => _AppState();
}

class _AppState extends State<App> {
  UserModel? _sessionUser;

  void _handleLogin(UserModel user) {
    setState(() {
      _sessionUser = user;
    });
  }

  void _handleLogout() {
    setState(() {
      _sessionUser = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      home: _sessionUser == null
          ? LoginScreen(
              onLoginSuccess: _handleLogin,
              onGoToRegister: () => Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) =>
                      RegisterScreen(onRegisterSuccess: _handleLogin),
                ),
              ),
              onGoToAuthorityLogin: () => Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) =>
                      AuthorityLoginScreen(onLoginSuccess: _handleLogin),
                ),
              ),
              onGoToAuthorityRegister: () => Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) =>
                      AuthorityRegisterScreen(onRegisterSuccess: _handleLogin),
                ),
              ),
            )
          : HomePage(user: _sessionUser!, onLogout: _handleLogout),
    );
  }
}
