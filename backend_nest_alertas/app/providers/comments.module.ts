import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Comment } from "app/models/comment.entity";

@Module({
    imports: [TypeOrmModule.forFeature([Comment])],
    providers: [],
    controllers: [],
})
export class CommentsModule{}