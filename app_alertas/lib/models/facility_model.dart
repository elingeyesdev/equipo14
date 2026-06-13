class FacilityModel {
  final int id;
  final String name;
  final String type;
  final String? address;
  final double latitude;
  final double longitude;
  final int? distanceMeters;

  const FacilityModel({
    required this.id,
    required this.name,
    required this.type,
    this.address,
    required this.latitude,
    required this.longitude,
    this.distanceMeters,
  });

  factory FacilityModel.fromJson(Map<String, dynamic> json) {
    return FacilityModel(
      id: int.tryParse(json['id']?.toString() ?? '') ?? 0,
      name: (json['name'] ?? '').toString(),
      type: (json['type'] ?? '').toString(),
      address: json['address']?.toString(),
      latitude: (json['latitude'] as num?)?.toDouble() ?? 0,
      longitude: (json['longitude'] as num?)?.toDouble() ?? 0,
      distanceMeters: (json['distance_meters'] as num?)?.round(),
    );
  }
}
