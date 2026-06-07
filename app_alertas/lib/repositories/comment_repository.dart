import 'package:app_alertas/models/comment_model.dart';
import 'package:app_alertas/services/comment_service.dart';

class CommentRepository {
  final CommentService _service;

  CommentRepository({CommentService? service})
      : _service = service ?? CommentService();

  Future<List<CommentModel>> getCommentsByReport(int reportId) async {
    return await _service.getCommentsByReport(reportId);
  }

  Future<CommentModel> createComment(int reportId, String creatorId, String text) async {
    return await _service.createComment(reportId, creatorId, text);
  }

  Future<List<CommentModel>> getRepliesByComment(int commentId) async {
    return await _service.getRepliesByComment(commentId);
  }

  Future<CommentModel> createReply(int commentId, String creatorId, String text) async {
    return await _service.createReply(commentId, creatorId, text);
  }
}
