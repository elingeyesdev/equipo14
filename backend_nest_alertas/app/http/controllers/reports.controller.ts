import { Body, Controller, Delete, Get, Param, Post, UploadedFile } from '@nestjs/common';
import { ReportsService } from '../../services/reports.service';
import { CreateReportRequest } from '../requests/reports/request';
import { ApiImageUpload } from '../../decorators/request.decorator';

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

    @Get()
    findAll(){
        return this.reportsService.findAll()
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
