import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiBody } from "@nestjs/swagger";
import { CommentsService } from "app/services/comments.service";
import { CreateCommentRequest } from "../requests/comments/request";

@ApiBearerAuth()
@Controller('comments')
export class CommentsController{
    constructor(private readonly commnetsService: CommentsService){}

    @Post(':id/replies')
    createReply(
        @Param('id') commentId: number,
        @Body() createCommentRequest: CreateCommentRequest
    ){
        return this.commnetsService.reply(commentId, createCommentRequest);
    }

    @Get(':id/replies')
    findReplies(@Param('id') commentId: number){
        return this.commnetsService.findReplies(commentId)
    }
}