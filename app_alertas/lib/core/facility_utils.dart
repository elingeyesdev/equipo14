import 'package:flutter/material.dart';

String facilityTypeLabel(String type) {
  switch (type) {
    case 'policia':
      return 'Policía';
    case 'bombero':
      return 'Bomberos';
    case 'hospital':
      return 'Hospital';
    case 'ambulancia':
      return 'Ambulancia';
    default:
      return type;
  }
}

Color facilityTypeColor(String type) {
  switch (type) {
    case 'policia':
      return const Color(0xFF506E96);
    case 'bombero':
      return const Color(0xFFAA5F3C);
    case 'hospital':
    case 'ambulancia':
      return const Color(0xFF3C8C6E);
    default:
      return const Color(0xFF64748B);
  }
}

IconData facilityTypeIcon(String type) {
  switch (type) {
    case 'policia':
      return Icons.local_police_rounded;
    case 'bombero':
      return Icons.local_fire_department_rounded;
    case 'hospital':
      return Icons.local_hospital_rounded;
    case 'ambulancia':
      return Icons.medical_services_rounded;
    default:
      return Icons.place_rounded;
  }
}

/// Tipo legible para tracking / Firebase según instalación.
String facilityTrackingType(String type) {
  switch (type) {
    case 'policia':
      return 'Policía';
    case 'bombero':
      return 'Bomberos';
    case 'hospital':
      return 'Hospital';
    case 'ambulancia':
      return 'Ambulancia';
    default:
      return facilityTypeLabel(type);
  }
}
