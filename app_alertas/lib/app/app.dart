import 'package:flutter/material.dart';
import 'package:app_alertas/presentation/theme/app_theme.dart';
import 'package:app_alertas/presentation/screens/home_page.dart';

/// Raíz de la app (MaterialApp + tema + pantalla inicial).
class App extends StatelessWidget {
  const App({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      home: const HomePage(),
    );
  }
}
