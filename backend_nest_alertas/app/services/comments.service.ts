import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { CreateCommentRequest } from "app/http/requests/comments/request";
import { CommentResponse } from "app/http/requests/comments/response";
import { Comment } from "app/models/comment.entity";
import { Report } from "app/models/report.entity";
import { User } from "app/models/user.entity";
import { IsNull, Repository } from 'typeorm';

@Injectable()
export class CommentsService{
    constructor(
        @InjectRepository(Comment)
        private commentsRepository: Repository<Comment>,
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        @InjectRepository(Report)
        private reportsRepository: Repository<Report>
    ){}

    async create(reportId: number, text: string, creatorId: string){
        const creator = await this.usersRepository.findOne({where: {id: creatorId}})
        
        if(!creator){
            throw new NotFoundException("Usuario no encontrado")
        }

        const report = await this.reportsRepository.findOne({where: {id: reportId}})
        
        if(!report){
            throw new NotFoundException("Reporte no encontrado")
        }

        const newCommnet = this.commentsRepository.create({
            text,
            report: report,
            creator: creator
        })

        const savedComment = await this.commentsRepository.save(newCommnet)

        return CommentResponse.FromCommentToResponse(savedComment)
    }

    async reply(parentCommentId: number, text: string, creatorId: string){
        const parentComment = await this.commentsRepository.findOne({where : {id: parentCommentId}})

        if (!parentComment){
            throw new NotFoundException("Comentario no encontrado")
        }

        const creator = await this.usersRepository.findOne({where: {id: creatorId}})
        
        if(!creator){
            throw new NotFoundException("Usuario no encontrado")
        }

        const newComment = this.commentsRepository.create({
            text,
            parent_comment: parentComment,
            report: parentComment.report,
            creator: creator,
        })

        const savedComment = await this.commentsRepository.save(newComment)

        return CommentResponse.FromCommentToResponse(savedComment)
    }

    async findByReport(reportId: number) {
        const report = await this.reportsRepository.findOne({
            where: { id: reportId }
        })

        if (!report) {
            throw new NotFoundException(
                `El reporte con ID ${reportId} no se encontro`
            )
        }

        const comments = await this.commentsRepository
            .createQueryBuilder('comment')
            .leftJoinAndSelect('comment.creator', 'creator')
            .loadRelationCountAndMap(
                'comment.responsesCount',
                'comment.responses'
            )
            .where('comment.reportId = :reportId', { reportId })
            .andWhere('comment.parentCommentId IS NULL')
            .orderBy('comment.created_at', 'DESC')
            .getMany()

        return comments.map(comment => ({
            ...CommentResponse.FromCommentToResponse(comment),
            replies_count: comment['responsesCount']
        }))
    }

    async findReplies(commentId: number){
        const comment = await this.commentsRepository.findOne({
            where: { id: commentId },
            relations: ['creator']
        })

        if(!comment){
            throw new NotFoundException(`El comentario con ID ${commentId} no se encontro`)
        }

        const replies = await this.commentsRepository.find({
            where: {
                    parent_comment: {
                        id: commentId
                    }
                },
                relations: ['creator'],
                order: {
                    created_at: 'DESC'
                }
        })
        return CommentResponse.FromCommentListToResponse(replies)
    }

    async remove(commentId: number) {
        const result = await this.commentsRepository.delete(commentId);
        if (!result.affected) {
            throw new NotFoundException(`El comentario con ID ${commentId} no se encontro`);
        }
        return { message: 'Comentario eliminado correctamente' };
    }
}