import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UploadedFile } from '@nestjs/common';
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
        console.log("Estoy aqui")
        return this.reportsService.addImage(id, file)
    }

    // modificar, solo para autoridades
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

    @Get('/zones')
    getZonesSummary() {
        return this.reportsService.getZonesSummary();
    }

    @Get('/zone/:name')
    findByZone(@Param('name') name: string) {
        return this.reportsService.findByZone(name);
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
