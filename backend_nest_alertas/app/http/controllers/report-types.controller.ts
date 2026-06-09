import { Body, Controller, Delete, Param, Post, Get, Request } from "@nestjs/common";
import { ApiBearerAuth, ApiBody } from "@nestjs/swagger";
import { ReportTypesService } from "app/services/report-types.service";
import { Public } from "app/decorators/public.decorator";
import { Roles } from "app/decorators/roles.decorator";

@ApiBearerAuth()
@Controller('report-types')
export class ReportTypeController{
    constructor(private readonly reportTypesService: ReportTypesService){}

    @Post()
    @Roles('admin')
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
        return this.reportTypesService.findAll()
    }

    @Delete(':id')
    @Roles('admin')
    remove(@Param('id') id: number){
        return this.reportTypesService.remove(id)
    }
}