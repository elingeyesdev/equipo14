import { Body, Controller, Delete, Param, Post, Get, Request } from "@nestjs/common";
import { ApiBody } from "@nestjs/swagger";
import { RolesService } from "app/services/roles.service";

@Controller('roles')
export class RolesController{
    constructor(private readonly rolesService: RolesService){}

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
    create(@Body('name') name: string, @Request() req){
        return this.rolesService.create(name)
    }

    @Get()
    findAll(){
        return this.rolesService.findAll()
    }

    @Delete(':id')
    remove(@Param('id') id: number){
        return this.rolesService.remove(id)
    }
}