import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:app_alertas/app/app.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_foreground_task/flutter_foreground_task.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  FlutterForegroundTask.initCommunicationPort();
  await Firebase.initializeApp();
  try {
    await dotenv.load(fileName: '.env');
  } catch (_) {
    // .env opcional: Mapbox y API usan fallbacks en código.
  }
  runApp(const App());
}



