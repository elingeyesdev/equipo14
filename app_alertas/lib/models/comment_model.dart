import 'package:app_alertas/models/user_model.dart';

class CommentModel {
  final int id;
  final String text;
  final DateTime createdAt;
  final CommentModel? parentComment;
  final UserModel? creator;
  final int repliesCount;

  const CommentModel({
    required this.id,
    required this.text,
    required this.createdAt,
    this.parentComment,
    this.creator,
    this.repliesCount = 0,
  });

  factory CommentModel.fromJson(Map<String, dynamic> json) {
    return CommentModel(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id'].toString()) ?? 0,
      text: json['text']?.toString() ?? '',
      createdAt: json['created_at'] != null 
          ? DateTime.tryParse(json['created_at'].toString()) ?? DateTime.now()
          : DateTime.now(),
      parentComment: json['parent_comment'] != null 
          ? CommentModel.fromJson(json['parent_comment'])
          : null,
      creator: json['creator'] != null 
          ? UserModel.fromJson(json['creator'])
          : null,
      repliesCount: json['replies_count'] is int 
          ? json['replies_count'] 
          : int.tryParse(json['replies_count']?.toString() ?? '0') ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'text': text,
    'created_at': createdAt.toIso8601String(),
    'parent_comment': parentComment?.toJson(),
    'creator': creator?.toJson(),
    'replies_count': repliesCount,
  };

  factory CommentModel.mock() {
    return CommentModel(
      id: 0,
      text: 'Cargando comentario falso para mostrar en skeletonizer',
      createdAt: DateTime.now(),
      repliesCount: 0,
      creator: const UserModel(
        id: '0',
        firstName: 'Nombre',
        lastName: 'Apellido',
        phone: '123456',
      ),
    );
  }
}
