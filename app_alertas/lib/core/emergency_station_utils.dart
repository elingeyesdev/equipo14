import 'package:flutter/material.dart';

String emergencyStationTypeLabel(String type) {
  switch (type) {
    case 'policia':
      return 'Policía';
    case 'bombero':
      return 'Bomberos';
    case 'hospital':
      return 'Hospital';
    default:
      return type;
  }
}

Color emergencyStationTypeColor(String type) {
  switch (type) {
    case 'policia':
      return const Color(0xFF506E96);
    case 'bombero':
      return const Color(0xFFAA5F3C);
    case 'hospital':
      return const Color(0xFF3C8C6E);
    default:
      return const Color(0xFF64748B);
  }
}

IconData emergencyStationTypeIcon(String type) {
  switch (type) {
    case 'policia':
      return Icons.local_police_rounded;
    case 'bombero':
      return Icons.local_fire_department_rounded;
    case 'hospital':
      return Icons.local_hospital_rounded;
    default:
      return Icons.place_rounded;
  }
}

/// Tipo legible para tracking / Firebase según instalación.
String emergencyStationTrackingType(String type) {
  switch (type) {
    case 'policia':
      return 'Policía';
    case 'bombero':
      return 'Bomberos';
    case 'hospital':
      return 'Hospital';
    default:
      return emergencyStationTypeLabel(type);
  }
}
