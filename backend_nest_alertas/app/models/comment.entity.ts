import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm"
import { Report } from "./report.entity";
import { User } from "./user.entity";

@Entity()
export class Comment{
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    text: string;

    @CreateDateColumn()
    created_at: Date;

    // Se referencia a si mismo para q tenga un comentario padre
    // y asi lograr q un comentario tenga respuestas
    @OneToMany(() => Comment, comment => comment.parent_comment)
    responses: Comment[]
    @ManyToOne(() => Comment, comment => comment.responses,
    {nullable: true})
    parent_comment: Comment

    @ManyToOne(() => Report, report => report.comments)
    report: Report

    @ManyToOne(() => User, user => user.commnets)
    creator: User
}