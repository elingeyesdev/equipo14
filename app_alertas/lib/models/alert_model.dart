/// Modelo consolidado para Alertas (anteriormente ReportModel).
/// Representa un incidente reportado en el sistema.
class AlertModel {
  final int id;
  final String userId;
  final String type;
  final String description;
  final List<double> coordinates;
  final double weight;
  final DateTime? createdAt;
  final DateTime? expiresAt;
  final List<String> images; // Simplificado a lista de URLs (Strings)
  final bool verified;
  final String? zone;

  const AlertModel({
    required this.id,
    required this.userId,
    required this.type,
    required this.description,
    required this.coordinates,
    required this.weight,
    this.createdAt,
    this.expiresAt,
    this.images = const [],
    this.verified = false,
    this.zone,
  });

  factory AlertModel.mock() {
    return AlertModel(
      id: 0,
      userId: 'mock_user',
      type: 'Incendio',
      description: 'Esta es una descripción falsa bastante larga para que el esqueleto tenga algo que mostrar en la pantalla de la app.',
      coordinates: const [0.0, 0.0],
      weight: 10,
      createdAt: DateTime.now(),
      zone: 'Zona de Prueba',
    );
  }

  factory AlertModel.fromJson(Map<String, dynamic> json) {
    // Extraer coordenadas
    final rawCoords = (json['coordinates'] as List<dynamic>? ?? [])
        .map((e) => (e as num).toDouble())
        .toList();

    // Simplificar imágenes a solo sus URLs
    final rawImages = json['images'] as List<dynamic>? ?? [];
    final images = rawImages
        .map((e) {
          if (e is Map) return (e['url'] ?? '').toString();
          return e.toString();
        })
        .where((url) => url.isNotEmpty)
        .toList();

    // Manejar el tipo de alerta (puede venir como objeto o string)
    String typeName = '';
    final rawType = json['type'];
    if (rawType is Map) {
      typeName = (rawType['name'] ?? '').toString();
    } else {
      typeName = (rawType ?? '').toString();
    }

    // Extraer creador/userId de forma ultra robusta
    String creatorId = '';
    final rawCreator = json['creator'] ?? json['userId'] ?? json['user_uuid'];
    if (rawCreator is Map) {
      creatorId = (rawCreator['id'] ?? '').toString();
    } else {
      creatorId = (rawCreator ?? '').toString();
    }

    return AlertModel(
      id: json['id'] is int
          ? json['id'] as int
          : int.tryParse('${json['id']}') ?? 0,
      userId: creatorId,
      type: typeName,
      description: (json['description'] ?? '').toString(),
      coordinates: rawCoords,
      weight: (json['weight'] as num?)?.toDouble() ?? 0,
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'].toString())
          : null,
      expiresAt: json['expires_at'] != null
          ? DateTime.tryParse(json['expires_at'].toString())
          : null,
      images: images,
      verified: json['verified'] == true,
      zone: json['zone']?.toString(),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'userId': userId,
    'type': type,
    'description': description,
    'coordinates': coordinates,
    'weight': weight,
    'created_at': createdAt?.toIso8601String(),
    'expires_at': expiresAt?.toIso8601String(),
    'images': images,
    'verified': verified,
    'zone': zone,
  };
}



