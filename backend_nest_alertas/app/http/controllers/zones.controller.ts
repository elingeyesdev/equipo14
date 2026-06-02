import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ZonesService } from 'app/services/zones.service';
import { CreateZoneRequest } from '../requests/zones/request';

@ApiBearerAuth()
@ApiTags('zones')
@Controller('zones')
export class ZonesController {
    constructor(private readonly zonesService: ZonesService) {}

    @Get()
    findAll() {
        return this.zonesService.findAll();
    }

    @Get('lookup')
    lookup(
        @Query('latitude') latitude: string,
        @Query('longitude') longitude: string,
    ) {
        return this.zonesService
            .findNameContainingPoint(Number(longitude), Number(latitude))
            .then((name) => ({ name }));
    }

    @Post()
    create(@Body() dto: CreateZoneRequest) {
        return this.zonesService.create(dto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.zonesService.remove(Number(id));
    }
}
