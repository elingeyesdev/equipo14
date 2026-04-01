import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportRequest } from './dto/request';

@Controller('reports')
export class ReportsController {
    constructor(private readonly reportsService: ReportsService){}

    @Post()
    create(@Body() createReportDto: CreateReportRequest){
        return this.reportsService.create(createReportDto)
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
