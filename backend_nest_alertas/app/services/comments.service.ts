import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Comment } from "app/models/comment.entity";
import { User } from "app/models/user.entity";
import { Repository } from 'typeorm';

// Falta mejorar los dos servicios, ademas de consider la implementacion de un request/response


    // Comment {
    // id
    // text
    // created_at
    // responses
    // parent_comment
    // report
    // creator
    //}
@Injectable()
export class CommentsService{
    constructor(
        @InjectRepository(Comment)
        private commentsRepository: Repository<Comment>,
        @InjectRepository(User)
        private usersRepository: Repository<User>
    ){}

    async create(text: string){
        const newCommnet = this.commentsRepository.create({
            text: text
        })

        const savedComment = await this.commentsRepository.save(newCommnet)

        return savedComment
    }

    async response(creatorId: string, parentCommentId: number, text: string){
        const parentComment = await this.commentsRepository.findOne({where : {id: parentCommentId}})

        if (!parentComment){
            throw new NotFoundException("Comentario no encontrado")
        }

        const creator = await this.usersRepository.findOne({where: {id: creatorId}})
        
        if(!creator){
            throw new NotFoundException("Usuario no encontrado")
        }

        const newComment = this.commentsRepository.create({
            text: text,
            parent_comment: parentComment,
            report: parentComment.report,
            creator: creator,
        })

        return await this.commentsRepository.save(newComment)
    }
}