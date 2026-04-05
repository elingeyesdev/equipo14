import 'package:app_alertas/data/models/image_model.dart';

/// Coincide con [ReportResponse] del backend NestJS.
class ReportModel {
  final int id;
  final String userUuid;
  final String type;
  final String description;
  final List<double> coordinates;
  final double weight;
  final DateTime? createdAt;
  final DateTime? expiresAt;
  final List<ImageModel> images;

  const ReportModel({
    required this.id,
    required this.userUuid,
    required this.type,
    required this.description,
    required this.coordinates,
    required this.weight,
    this.createdAt,
    this.expiresAt,
    this.images = const [],
  });

  factory ReportModel.fromJson(Map<String, dynamic> json) {
    final rawCoords = (json['coordinates'] as List<dynamic>? ?? [])
        .map((e) => (e as num).toDouble())
        .toList();

    final rawImages = json['images'] as List<dynamic>? ?? [];
    final images = rawImages
        .map((e) => ImageModel.fromJson(e as Map<String, dynamic>))
        .toList();

    return ReportModel(
      id: json['id'] is int ? json['id'] as int : int.tryParse('${json['id']}') ?? 0,
      userUuid: (json['user_uuid'] ?? '').toString(),
      type: (json['type'] ?? '').toString(),
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
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'user_uuid': userUuid,
        'type': type,
        'description': description,
        'coordinates': coordinates,
        'weight': weight,
        'created_at': createdAt?.toIso8601String(),
        'expires_at': expiresAt?.toIso8601String(),
        'images': images.map((e) => e.toJson()).toList(),
      };
}
