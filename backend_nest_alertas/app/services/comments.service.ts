import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Comment } from "app/models/comment.entity";
import { Repository } from 'typeorm';

// Falta mejorar los dos servicios, ademas de consider la implementacion de un request/response
@Injectable()
export class CommentsService{
    constructor(
        @InjectRepository(Comment)
        private commentsRepository: Repository<Comment>
    ){}

    async create(text: string){
        const newCommnet = this.commentsRepository.create({
            text: text
        })

        const savedComment = await this.commentsRepository.save(newCommnet)

        return savedComment
    }

    async response(id: number, text: string){
        const parentComment = await this.commentsRepository.findOne({where : {id: Number(id)}})

        if (!parentComment){
            throw new NotFoundException("Comentario no encontrado")
        }

        const newComment = this.commentsRepository.create({
            text: text,
            parent_comment: parentComment,
            report: parentComment.report,
            creator: parentComment.creator,
        })

        return await this.commentsRepository.save(newComment)
    }
}