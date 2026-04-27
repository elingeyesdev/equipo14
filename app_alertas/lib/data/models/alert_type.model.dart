/// Modelo para los tipos de alertas devueltos por el backend.
class ReportTypeModel {
  final int id;
  final String name;

  const ReportTypeModel({required this.id, required this.name});

  factory ReportTypeModel.fromJson(Map<String, dynamic> json) {
    return ReportTypeModel(
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
