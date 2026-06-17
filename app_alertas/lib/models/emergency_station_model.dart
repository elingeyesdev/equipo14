class EmergencyStationModel {
  final int id;
  final String name;
  final String installationType;
  final List<double> coordinates;
  final int? distanceMeters;

  const EmergencyStationModel({
    required this.id,
    required this.name,
    required this.installationType,
    required this.coordinates,
    this.distanceMeters,
  });

  factory EmergencyStationModel.fromJson(Map<String, dynamic> json) {
    final rawCoords = json['coordinates'] as List<dynamic>?;
    final coordsList = rawCoords != null
        ? rawCoords.map((e) => (e as num).toDouble()).toList()
        : const <double>[];

    return EmergencyStationModel(
      id: int.tryParse(json['id']?.toString() ?? '') ?? 0,
      name: (json['name'] ?? '').toString(),
      installationType: (json['installation_type'] ?? '').toString(),
      coordinates: coordsList,
      distanceMeters: (json['distance_meters'] as num?)?.round(),
    );
  }
}
