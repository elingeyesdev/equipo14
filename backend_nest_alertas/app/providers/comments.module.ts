import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CommentsController } from "app/http/controllers/comment.controller";
import { Comment } from "app/models/comment.entity";
import { Report } from "app/models/report.entity";
import { User } from "app/models/user.entity";
import { CommentsService } from "app/services/comments.service";

@Module({
    imports: [TypeOrmModule.forFeature([Comment, User, Report])],
    providers: [CommentsService],
    controllers: [CommentsController],
    exports: [CommentsService]
})
export class CommentsModule{}