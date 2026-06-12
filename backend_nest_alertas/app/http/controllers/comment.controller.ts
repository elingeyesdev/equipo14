import { Body, Controller, Delete, Get, Param, Post, Request } from "@nestjs/common";
import { ApiBearerAuth, ApiBody } from "@nestjs/swagger";
import { CommentsService } from "app/services/comments.service";
import { CreateCommentRequest } from "../requests/comments/request";
import { Roles } from "app/decorators/roles.decorator";

@ApiBearerAuth()
@Controller('comments')
export class CommentsController{
    constructor(private readonly commnetsService: CommentsService){}

    @Post(':id/replies')
    createReply(
        @Param('id') commentId: number,
        @Body() createCommentRequest: CreateCommentRequest,
        @Request() req: { user: { id: string } },
    ){
        return this.commnetsService.reply(commentId, createCommentRequest.text, req.user.id);
    }

    @Get(':id/replies')
    findReplies(@Param('id') commentId: number){
        return this.commnetsService.findReplies(commentId)
    }

    @Delete(':id')
    @Roles('admin')
    remove(@Param('id') commentId: number){
        return this.commnetsService.remove(Number(commentId));
    }
}
