import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UploadedFile } from '@nestjs/common';
import { ReportsService } from '../../services/reports.service';
import { CreateReportRequest, VerifyReportRequest } from '../requests/reports/request';
import { FilterReportsQuery } from '../requests/reports/filter-query';
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
        @Body() createReportDto: CreateReportRequest,
        @Request() req: { user: { id: string } },
    ){
        return this.reportsService.create(createReportDto, file, req.user.id)
    }

    @Post(':id/comments')
    createComment(
        @Param('id') reportId: number,
        @Body() createCommentRequest: CreateCommentRequest,
        @Request() req: { user: { id: string } },
    ){
        return this.commentsService.create(reportId, createCommentRequest.text, req.user.id)
    }

    @Post(':id/images')
    @ApiAddImageUpload()
    uploadImage(
        @Param('id') reportId: number,
        @UploadedFile() file: Express.Multer.File,
        @Request() req: { user: { id: string } },
    ){
        return this.reportsService.addImage(reportId, req.user.id, file)
    }

    /** @deprecated Usar POST :id/images — mantiene compatibilidad móvil antigua */
    @Post(':id/images/:userId')
    @ApiAddImageUpload()
    uploadImageLegacy(
        @Param('id') reportId: number,
        @UploadedFile() file: Express.Multer.File,
        @Request() req: { user: { id: string } },
    ){
        return this.reportsService.addImage(reportId, req.user.id, file)
    }

    @Patch(':id/verify')
    @Roles('admin','autoridad')
    verifyReport(
        @Param('id') id: number,
        @Request() req: { user: { id: string; role?: { name?: string } } },
    ) {
        return this.reportsService.verifyReport(id, req.user);
    }

    @Get()
    findAll(@Query() filters: FilterReportsQuery, @Request() req: { user?: { role?: { name?: string } } }) {
        return this.reportsService.findAll(filters, req.user);
    }

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

    @Delete(':id')
    @Roles('admin', 'autoridad')
    remove(
        @Param('id') id: string,
        @Request() req: { user: { id: string } },
    ){
        return this.reportsService.remove(id, req.user.id)
    }
}
