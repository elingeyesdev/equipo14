import { Body, Controller, Delete, Param, Post, Get, Request } from "@nestjs/common";
import { ApiBearerAuth, ApiBody } from "@nestjs/swagger";
import { Roles } from "app/decorators/roles.decorator";
import { RolesService } from "app/services/roles.service";

@ApiBearerAuth()
@Controller('roles')
export class RolesController{
    constructor(private readonly rolesService: RolesService){}

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
    create(@Body('name') name: string, @Request() req){
        return this.rolesService.create(name)
    }

    @Get()
    findAll(){
        return this.rolesService.findAll()
    }

    @Delete(':id')
    @Roles('admin')
    remove(@Param('id') id: number){
        return this.rolesService.remove(id)
    }
}