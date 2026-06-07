import 'package:dio/dio.dart';
import 'package:app_alertas/core/network/dio_client.dart';
import 'package:app_alertas/models/comment_model.dart';

class CommentService {
  final Dio _dio;

  CommentService({Dio? dio}) : _dio = dio ?? dioClient.dio;

  Future<List<CommentModel>> getCommentsByReport(int reportId) async {
    final response = await _dio.get('/reports/$reportId/comments');
    final List<dynamic> data = response.data;
    return data.map((json) => CommentModel.fromJson(json)).toList();
  }

  Future<CommentModel> createComment(int reportId, String creatorId, String text) async {
    final response = await _dio.post(
      '/reports/$reportId/comments',
      data: {
        'creatorId': creatorId,
        'text': text,
      },
    );
    return CommentModel.fromJson(response.data);
  }

  Future<List<CommentModel>> getRepliesByComment(int commentId) async {
    final response = await _dio.get('/comments/$commentId/replies');
    final List<dynamic> data = response.data;
    return data.map((json) => CommentModel.fromJson(json)).toList();
  }

  Future<CommentModel> createReply(int commentId, String creatorId, String text) async {
    final response = await _dio.post(
      '/comments/$commentId/replies',
      data: {
        'creatorId': creatorId,
        'text': text,
      },
    );
    return CommentModel.fromJson(response.data);
  }
}
