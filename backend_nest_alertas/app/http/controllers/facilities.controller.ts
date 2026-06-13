import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FacilitiesService } from 'app/services/facilities.service';

@ApiBearerAuth()
@ApiTags('facilities')
@Controller('facilities')
export class FacilitiesController {
    constructor(private readonly facilitiesService: FacilitiesService) {}

    @Get()
    findAll() {
        return this.facilitiesService.findAll();
    }

    @Get('nearby')
    findNearby(
        @Query('latitude') latitude: string,
        @Query('longitude') longitude: string,
        @Query('profileType') profileType?: string,
        @Query('types') types?: string,
        @Query('limit') limit?: string,
    ) {
        const parsedTypes = types
            ? types.split(',').map((t) => t.trim()).filter(Boolean)
            : undefined;

        return this.facilitiesService.findNearby(
            Number(latitude),
            Number(longitude),
            {
                profileType,
                types: parsedTypes,
                limit: limit ? Number(limit) : undefined,
            },
        );
    }
}
