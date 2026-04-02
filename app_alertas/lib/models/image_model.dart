class ImageModel {
  final int id;
  final String url;
  final DateTime? uploadedAt;

  const ImageModel({
    required this.id,
    required this.url,
    this.uploadedAt,
  });

  factory ImageModel.fromJson(Map<String, dynamic> json) {
    return ImageModel(
      id: json['id'] is int ? json['id'] as int : int.tryParse('${json['id']}') ?? 0,
      url: (json['url'] ?? '').toString(),
      uploadedAt: json['uploaded_at'] != null
          ? DateTime.tryParse(json['uploaded_at'].toString())
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'url': url,
        'uploaded_at': uploadedAt?.toIso8601String(),
      };
}
