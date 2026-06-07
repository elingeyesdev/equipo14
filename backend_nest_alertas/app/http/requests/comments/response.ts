import { Comment } from "app/models/comment.entity";

export class CommentResponse{
    id: number;
    text: string;
    created_at: Date;
    parent_comment: {
        id: number;
        text: string;
        created_at: Date;
    } | null
    creator: {
        id: string;
        first_name: string;
        last_name: string,
        phone: string;
    }

    static FromCommentToResponse(comment: Comment): CommentResponse {
        const response = new CommentResponse();

        response.id = comment.id;
        response.text = comment.text;
        response.created_at = comment.created_at;
        response.parent_comment = comment.parent_comment ? {
            id: comment.parent_comment.id,
            text: comment.parent_comment.text,
            created_at: comment.parent_comment.created_at,
        } : null;
        response.creator = {
            id: comment.creator.id,
            first_name: comment.creator.first_name,
            last_name: comment.creator.last_name,
            phone: comment.creator.phone,
        };

        return response;
    }

    static FromCommentListToResponse(comments: Comment[]): CommentResponse[]{
        return comments.map(comment => this.FromCommentToResponse(comment))
    }
}