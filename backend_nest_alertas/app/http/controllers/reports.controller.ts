import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UploadedFile } from '@nestjs/common';
import { ReportsService } from '../../services/reports.service';
import { CreateReportRequest, VerifyReportRequest } from '../requests/reports/request';

import { ApiAddImageUpload, ApiImageUpload } from '../../decorators/request.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CommentsService } from 'app/services/comments.service';
import { CreateCommentRequest } from '../requests/comments/request';
import { Roles } from 'app/decorators/roles.decorator';

@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
    constructor(
        private readonly reportsService: ReportsService,
        private readonly commentsService: CommentsService
    ){}

    @Post()
    @ApiImageUpload()
    create(
        @UploadedFile() file: Express.Multer.File,
        @Body() createReportDto: CreateReportRequest
    ){
        return this.reportsService.create(createReportDto, file)
    }

    @Post(':id/comments')
    createComment(
        @Param('id') reportId: number, 
        @Body() createCommentRequest: CreateCommentRequest
    ){
        return this.commentsService.create(reportId, createCommentRequest)
    }

    @Post(':id/images/:userId')
    @ApiAddImageUpload()
    uploadImage(
        @Param('userId') userId: string,
        @Param('id') reportId: number, 
        @UploadedFile() file: Express.Multer.File
    ){
        return this.reportsService.addImage(reportId, userId, file)
    }

    // modificar, solo para autoridades
    // unicamnete permite a autoridades verificar los reportes
    @Patch(':id/verify')
    @Roles('admin','autoridad')
    verifyReport(@Param('id') id: number) 
    {
        return this.reportsService.verifyReport(id);
    }

    @Get()
    findAll() {
        return this.reportsService.findAll();
    }

    // este endpoint devuelve los reportes en un radio de proximo
    @Get('/nearby')
    findNearby(
        @Query('latitude') latitude: string,
        @Query('longitude') longitude: string,
        @Query('radius') radius: string,
    ) {
        return this.reportsService.findNearby(
            Number(latitude),
            Number(longitude),
            Number(radius),
        );
    }

    @Get('/similars')
    findCoincidences(@Query() verifyReportRequest: VerifyReportRequest){
        return this.reportsService.findCoincidences(verifyReportRequest)
    }

    @Get('/user/:userId')
    findByUser(@Param('userId') userId: string) {
        return this.reportsService.findByUserId(userId);
    }

    @Get(':id')
    findOne(@Param('id') id:string){
        return this.reportsService.findOne(id)
    }

    @Get(':id/comments')
    findComments(@Param('id') reportId: number){
        return this.commentsService.findByReport(reportId)
    }

    @Patch(':id/resolve')
    resolveReport(@Param('id') id: number) {
        return this.reportsService.resolveReport(Number(id));
    }

    @Patch(':id/reactivate')
    reactivateReport(@Param('id') id: number) {
        return this.reportsService.reactivateReport(Number(id));
    }

    @Delete(':id')
    remove(@Param('id') id:string){
        return this.reportsService.remove(id)
    }
}
