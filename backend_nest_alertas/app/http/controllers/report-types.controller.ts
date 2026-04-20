import { Body, Controller, Delete, Param, Post, Get } from "@nestjs/common";
import { ApiBody, ApiSchema } from "@nestjs/swagger";
import { ReportTypesService } from "app/services/report-types.service";

@Controller('report-types')
export class ReportTypeController{
    constructor(private readonly reportTypesService: ReportTypesService){}

    @Post()
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                name: {
                    type: 'string',
                }
            },
        }
    })
    create(@Body('name') name: string){
        return this.reportTypesService.create(name)
    }

    @Get()
    findAll(){
        return this.reportTypesService.finAll()
    }

    @Delete(':id')
    remove(@Param('id') id: number){
        return this.reportTypesService.remove(id)
    }
}