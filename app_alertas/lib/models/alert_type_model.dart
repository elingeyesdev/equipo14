/// Modelo para los tipos de alertas devueltos por el backend.
class AlertTypeModel {
  final int id;
  final String name;

  const AlertTypeModel({required this.id, required this.name});

  factory AlertTypeModel.fromJson(Map<String, dynamic> json) {
    return AlertTypeModel(
      id: json['id'] is int
          ? json['id'] as int
          : int.tryParse('${json['id']}') ?? 0,
      name: (json['name'] ?? '').toString(),
    );
  }

  Map<String, dynamic> toJson() => {'id': id, 'name': name};

  @override
  String toString() => name;
}



