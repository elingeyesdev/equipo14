import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:app_alertas/app/app.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  try {
    await dotenv.load(fileName: '.env');
  } catch (_) {
    // .env opcional: Mapbox y API usan valores por defecto en código
  }
  runApp(const App());
}



