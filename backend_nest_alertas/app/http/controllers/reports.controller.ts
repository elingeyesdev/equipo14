import { Body, Controller, Delete, Get, Param, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ReportsService } from '../../services/reports.service';
import { CreateReportRequest, VerifyReportRequest } from '../requests/reports/request';
import { ApiAddImageUpload, ApiImageUpload } from '../../decorators/request.decorator';

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

    @Post(':id/images')
    @ApiAddImageUpload()
    uploadImage(@Param('id') id: number, @UploadedFile() file: Express.Multer.File,){
        return this.reportsService.addImage(id, file)
    }

    @Get()
    findAll(){
        return this.reportsService.findAll()
    }

    @Get('/similars')
    findCoincidences(@Query() verifyReportRequest: VerifyReportRequest){
        return this.reportsService.findCoincidences(verifyReportRequest)
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
