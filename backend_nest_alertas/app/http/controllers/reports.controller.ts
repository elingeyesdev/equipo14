import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UploadedFile } from '@nestjs/common';
import { ReportsService } from '../../services/reports.service';
import { CreateReportRequest, VerifyReportRequest } from '../requests/reports/request';
import { ApiAddImageUpload, ApiImageUpload } from '../../decorators/request.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
    constructor(private readonly reportsService: ReportsService){}

    @Post()
    @ApiImageUpload()
    create(
        @UploadedFile() file: Express.Multer.File,
        @Body() createReportDto: CreateReportRequest
    ){
        return this.reportsService.create(createReportDto, file)
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
    verifyReport(@Param('id') id: number) 
    {
        return this.reportsService.verifyReport(id);
    }

    @Get()
    findAll(){
        return this.reportsService.findAll()
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

    @Delete(':id')
    remove(@Param('id') id:string){
        return this.reportsService.remove(id)
    }
}
