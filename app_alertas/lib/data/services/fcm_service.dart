import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:app_alertas/data/services/api_service.dart';
import 'package:flutter/foundation.dart';

class FcmService {
  final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;
  final ApiService _apiService = ApiService();
  final FlutterLocalNotificationsPlugin _localNotificationsPlugin =
      FlutterLocalNotificationsPlugin();

  Future<void> init(String userId) async {
    try {
      // Configurar notificaciones locales para mostrar el push real cuando la app está abierta
      const AndroidInitializationSettings initializationSettingsAndroid =
          AndroidInitializationSettings('@mipmap/ic_launcher');
      const InitializationSettings initializationSettings =
          InitializationSettings(android: initializationSettingsAndroid);
      await _localNotificationsPlugin.initialize(
        settings: initializationSettings,
      );

      // Solicitar permisos al usuario (necesario en iOS y Android 13+)
      NotificationSettings settings = await _firebaseMessaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
      );

      if (settings.authorizationStatus == AuthorizationStatus.authorized) {
        // Obtener el token del dispositivo
        String? token = await _firebaseMessaging.getToken();
        if (token != null) {
          debugPrint('FCM Token: $token');
          // Enviar el token a nuestro backend
          await _apiService.actualizarFcmToken(userId, token);
        }

        // Escuchar actualizaciones del token (si cambia, reenviar al backend)
        _firebaseMessaging.onTokenRefresh.listen((newToken) {
          _apiService.actualizarFcmToken(userId, newToken);
        });
      }
    } catch (e) {
      debugPrint('Error inicializando FCM: $e');
    }
  }

  // Escuchar mensajes en primer plano
  void listenToForegroundMessages(Function onMessageReceived) {
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      debugPrint('Mensaje recibido en primer plano: ${message.notification?.title}');
      
      RemoteNotification? notification = message.notification;
      AndroidNotification? android = message.notification?.android;

      if (notification != null && android != null) {
        _localNotificationsPlugin.show(
          id: notification.hashCode,
          title: notification.title,
          body: notification.body,
          notificationDetails: const NotificationDetails(
            android: AndroidNotificationDetails(
              'alert_channel', // id
              'Alertas', // title
              channelDescription: 'Canal para alertas de incidentes cercanos',
              importance: Importance.max,
              priority: Priority.high,
              icon: '@mipmap/ic_launcher',
            ),
          ),
        );
      }
      
      onMessageReceived();
    });
  }
}
