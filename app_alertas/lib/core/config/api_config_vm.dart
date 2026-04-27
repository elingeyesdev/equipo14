import 'dart:io' show Platform;

/// Host que alcanza el backend en la máquina de desarrollo (emulador Android → 10.0.2.2).
String apiLoopbackHost() => Platform.isAndroid ? '10.0.2.2' : 'localhost';
