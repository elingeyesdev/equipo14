import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:app_alertas/viewmodels/comment_viewmodel.dart';
import 'package:app_alertas/viewmodels/auth_viewmodel.dart';
import 'package:app_alertas/models/comment_model.dart';
import 'package:skeletonizer/skeletonizer.dart';

class CommentsScreen extends StatefulWidget {
  final int alertId;

  const CommentsScreen({super.key, required this.alertId});

  @override
  State<CommentsScreen> createState() => _CommentsScreenState();
}

class _CommentsScreenState extends State<CommentsScreen> {
  final TextEditingController _commentController = TextEditingController();
  final FocusNode _focusNode = FocusNode();
  bool _isPosting = false;
  
  // Control de qué comentarios tienen las respuestas desplegadas
  final Set<int> _expandedComments = {};
  final Set<int> _loadingReplies = {};
  
  int? _replyingToCommentId;
  String? _replyingToCommentText;

  @override
  void initState() {
    super.initState();
    _focusNode.addListener(() {
      setState(() {});
    });
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<CommentViewModel>().clear();
      _refresh();
    });
  }

  @override
  void dispose() {
    _focusNode.dispose();
    _commentController.dispose();
    super.dispose();
  }

  void _startReplying(int commentId, String text) {
    setState(() {
      _replyingToCommentId = commentId;
      _replyingToCommentText = text;
    });
    _focusNode.requestFocus();
  }

  void _cancelReply() {
    setState(() {
      _replyingToCommentId = null;
      _replyingToCommentText = null;
    });
    _focusNode.unfocus();
  }

  Future<void> _refresh() async {
    await context.read<CommentViewModel>().fetchComments(widget.alertId);
    if (mounted) {
      setState(() {
        // Mantenemos los comentarios expandidos para que no se colapsen al enviar una respuesta
      });
    }
  }

  Future<void> _postComment() async {
    final text = _commentController.text.trim();
    if (text.isEmpty) return;

    final auth = context.read<AuthViewModel>();
    final commentVM = context.read<CommentViewModel>();
    final userId = auth.user?.id;
    if (userId == null) return;

    setState(() => _isPosting = true);

    try {
      if (_replyingToCommentId != null) {
        final commentId = _replyingToCommentId!;
        await commentVM.createReply(commentId, userId, text);
        _replyingToCommentId = null;
        _replyingToCommentText = null;
        
        if (!_expandedComments.contains(commentId)) {
          setState(() {
            _expandedComments.add(commentId);
          });
        }
        await commentVM.fetchReplies(commentId);
      } else {
        await commentVM.createComment(widget.alertId, userId, text);
      }
      
      _commentController.clear();
      await _refresh();
    } catch (e) {
      // Manejar error si es necesario
    } finally {
      if (mounted) {
        setState(() => _isPosting = false);
      }
    }
  }

  Future<void> _toggleReplies(int commentId) async {
    if (_expandedComments.contains(commentId)) {
      // Si ya está expandido, lo cerramos
      setState(() {
        _expandedComments.remove(commentId);
      });
    } else {
      // Si no, lo abrimos y cargamos sus respuestas si es necesario
      setState(() {
        _expandedComments.add(commentId);
        _loadingReplies.add(commentId);
      });
      try {
        await context.read<CommentViewModel>().fetchReplies(commentId);
      } finally {
        if (mounted) {
          setState(() {
            _loadingReplies.remove(commentId);
          });
        }
      }
    }
  }

  String _initials(String? firstName, String? lastName) {
    String f = (firstName?.isNotEmpty == true) ? firstName![0] : '';
    String l = (lastName?.isNotEmpty == true) ? lastName![0] : '';
    return (f + l).toUpperCase();
  }

  String _formatTimeAgo(DateTime? dateTime) {
    if (dateTime == null) return '';
    final diff = DateTime.now().toUtc().difference(dateTime.toUtc());
    if (diff.inSeconds < 60) return '${diff.inSeconds}seg';
    if (diff.inMinutes < 60) return '${diff.inMinutes}min';
    if (diff.inHours < 24) return '${diff.inHours}h';
    return '${diff.inDays}d';
  }

  Widget _buildCommentItem(CommentModel comment, bool isReply, {bool isExpanded = false, VoidCallback? onToggle}) {
    final creator = comment.creator;
    final fullName = creator != null
        ? '${creator.firstName} ${creator.lastName}'.trim()
        : 'Usuario desconocido';
    final initials = creator != null
        ? _initials(creator.firstName, creator.lastName)
        : '?';

    return Padding(
      padding: EdgeInsets.only(
        left: isReply ? 46 : 0, // Sangría si es respuesta (mismo espacio que deja el avatar principal)
        bottom: isReply ? 12 : 16,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            radius: isReply ? 14 : 18,
            backgroundColor: Colors.grey.shade800,
            child: Text(
              initials,
              style: TextStyle(
                color: Colors.white,
                fontSize: isReply ? 10 : 12,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      fullName,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      _formatTimeAgo(comment.createdAt),
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.5),
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  comment.text,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                  ),
                ),
                // Botón Responder
                if (!isReply)
                  GestureDetector(
                    onTap: () => _startReplying(comment.id, comment.text),
                    child: Padding(
                      padding: const EdgeInsets.only(top: 8, bottom: 4),
                      child: Text(
                        'Responder',
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.5),
                          fontSize: 13,
                          fontWeight: FontWeight.normal,
                        ),
                      ),
                    ),
                  ),
                // Botón de ver respuestas (solo se muestra si no está expandido)
                if (!isReply && comment.repliesCount > 0 && !isExpanded)
                  GestureDetector(
                    onTap: onToggle,
                    child: Padding(
                      padding: const EdgeInsets.only(top: 8, bottom: 4),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 32,
                            height: 1,
                            color: Colors.white.withValues(alpha: 0.2),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            'ver ${comment.repliesCount} respuestas más',
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.5),
                              fontSize: 13,
                              fontWeight: FontWeight.normal,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final commentVM = context.watch<CommentViewModel>();
    
    final isLoading = commentVM.isLoading;
    final isInitialLoading = isLoading && commentVM.comments.isEmpty;
    final displayComments = isInitialLoading
        ? List.generate(5, (_) => CommentModel.mock())
        : commentVM.comments;

    return Scaffold(
      backgroundColor: const Color(0xFF262624),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Envolvemos solo el Header en SafeArea (top) para dejar que el Footer maneje el bottom
          SafeArea(
            bottom: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(12, 20, 24, 0),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back, color: Colors.white),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                  const SizedBox(width: 8),
                  const Text(
                    "Respuestas",
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.normal,
                      letterSpacing: -0.3,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
            ),
          ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: _refresh,
              child: (!isLoading && commentVM.comments.isEmpty)
                  ? CustomScrollView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      slivers: [
                        SliverFillRemaining(
                          child: Center(
                            child: Text(
                              'No hay respuestas aún.',
                              style: TextStyle(color: Colors.white),
                            ),
                          ),
                        ),
                      ],
                    )
                  : Skeletonizer(
                      enabled: isInitialLoading,
                      child: ListView.builder(
                        physics: const AlwaysScrollableScrollPhysics(),
                        padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                        itemCount: displayComments.length,
                        itemBuilder: (context, index) {
                          final comment = displayComments[index];
                          final isExpanded = _expandedComments.contains(comment.id);
                          final isLoadingReplies = _loadingReplies.contains(comment.id);
                          final replies = commentVM.replies[comment.id] ?? [];

                          return Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildCommentItem(
                                comment, 
                                false, 
                                isExpanded: isExpanded, 
                                onToggle: () => _toggleReplies(comment.id)
                              ),
                              if (isExpanded)
                                isLoadingReplies
                                    ? Skeletonizer(
                                        enabled: true,
                                        child: Column(
                                          children: List.generate(
                                            2,
                                            (_) => _buildCommentItem(CommentModel.mock(), true),
                                          ),
                                        ),
                                      )
                                    : Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          ...replies.map((reply) => _buildCommentItem(reply, true)),
                                          GestureDetector(
                                            onTap: () => _toggleReplies(comment.id),
                                            child: Padding(
                                              padding: const EdgeInsets.only(left: 46, bottom: 16, top: 4),
                                              child: Row(
                                                mainAxisSize: MainAxisSize.min,
                                                children: [
                                                  Container(
                                                    width: 32,
                                                    height: 1,
                                                    color: Colors.white.withValues(alpha: 0.2),
                                                  ),
                                                  const SizedBox(width: 8),
                                                  Text(
                                                    'ocultar respuestas',
                                                    style: TextStyle(
                                                      color: Colors.white.withValues(alpha: 0.5),
                                                      fontSize: 13,
                                                      fontWeight: FontWeight.normal,
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                            ],
                          );
                        },
                      ),
                    ),
            ),
          ),
          Container(
            decoration: BoxDecoration(
              color: const Color(0xFF1E1E1C),
              border: Border(
                top: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
              ),
            ),
            child: SafeArea(
              top: false,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (_replyingToCommentId != null)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.03),
                        border: Border(
                          bottom: BorderSide(color: Colors.white.withValues(alpha: 0.05)),
                        ),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.reply_rounded, color: Colors.white.withValues(alpha: 0.5), size: 16),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Respondiendo a: ${_replyingToCommentText ?? ""}',
                              style: TextStyle(
                                color: Colors.white.withValues(alpha: 0.7),
                                fontSize: 13,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 8),
                          GestureDetector(
                            onTap: _cancelReply,
                            child: Icon(Icons.close, color: Colors.white.withValues(alpha: 0.5), size: 18),
                          ),
                        ],
                      ),
                    ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    child: Row(
                      children: [
                        Expanded(
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.05),
                          borderRadius: BorderRadius.circular(24),
                          border: Border.all(
                            color: _focusNode.hasFocus 
                                ? const Color(0xFFAF6D58) // Color café suave 
                                : Colors.transparent,
                            width: 1.2,
                          ),
                        ),
                        child: TextField(
                          focusNode: _focusNode,
                          controller: _commentController,
                          style: const TextStyle(color: Colors.white),
                          decoration: InputDecoration(
                            filled: false,
                            fillColor: Colors.transparent,
                            border: InputBorder.none,
                            enabledBorder: InputBorder.none,
                            focusedBorder: InputBorder.none,
                            disabledBorder: InputBorder.none,
                            errorBorder: InputBorder.none,
                            hintText: 'Añadir una respuesta...',
                            hintStyle: TextStyle(color: Colors.white.withValues(alpha: 0.5)),
                            isDense: true,
                            contentPadding: const EdgeInsets.symmetric(vertical: 10),
                          ),
                          textCapitalization: TextCapitalization.sentences,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    _isPosting
                        ? const Padding(
                            padding: EdgeInsets.all(12),
                            child: SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            ),
                          )
                        : IconButton(
                            icon: const Icon(Icons.send_rounded, color: Colors.white),
                            onPressed: _postComment,
                          ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    ],
  ),
);
  }
}
