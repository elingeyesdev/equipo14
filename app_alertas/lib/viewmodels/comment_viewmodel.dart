import 'package:flutter/material.dart';
import 'package:app_alertas/models/comment_model.dart';
import 'package:app_alertas/repositories/comment_repository.dart';

class CommentViewModel extends ChangeNotifier {
  final CommentRepository _repository;

  CommentViewModel({CommentRepository? repository})
      : _repository = repository ?? CommentRepository();

  List<CommentModel> _comments = [];
  List<CommentModel> get comments => _comments;

  // Mapa para almacenar las respuestas a cada comentario, mapeadas por commentId
  Map<int, List<CommentModel>> _replies = {};
  Map<int, List<CommentModel>> get replies => _replies;

  bool _isLoading = false;
  bool get isLoading => _isLoading;

  String? _error;
  String? get error => _error;

  void clear() {
    _comments = [];
    _replies = {};
    _error = null;
    notifyListeners();
  }

  Future<void> fetchComments(int reportId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _comments = await _repository.getCommentsByReport(reportId);
      // Ordenamos por fecha de creación (de más nuevo a más antiguo)
      _comments.sort((a, b) => b.createdAt.compareTo(a.createdAt));
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<CommentModel> createComment(int reportId, String creatorId, String text) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final comment = await _repository.createComment(reportId, creatorId, text);
      _comments.insert(0, comment); // Añadimos el nuevo comentario al inicio de la lista
      return comment;
    } catch (e) {
      _error = e.toString();
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchReplies(int commentId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final fetchedReplies = await _repository.getRepliesByComment(commentId);
      fetchedReplies.sort((a, b) => b.createdAt.compareTo(a.createdAt));
      _replies[commentId] = fetchedReplies;
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<CommentModel> createReply(int commentId, String creatorId, String text) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final reply = await _repository.createReply(commentId, creatorId, text);
      if (_replies.containsKey(commentId)) {
        _replies[commentId]!.insert(0, reply);
      } else {
        _replies[commentId] = [reply];
      }
      return reply;
    } catch (e) {
      _error = e.toString();
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
