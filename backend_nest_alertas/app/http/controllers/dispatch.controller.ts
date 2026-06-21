import { Body, Controller, Post, Patch, Param } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { DispatchService } from 'app/services/dispatch.service';
import { CreateDispatchRequest, UpdateDispatchStateRequest } from 'app/http/requests/dispatches/request';

@ApiBearerAuth()
@Controller('dispatches')
export class DispatchController {
    constructor(private readonly dispatchService: DispatchService) {}

    @Post()
    create(@Body() dto: CreateDispatchRequest) {
        console.log('aqui')
        return this.dispatchService.create(dto.reportId, dto.destinationId, dto.userId);
    }

    @Patch(':id/state')
    updateState(@Param('id') id: string, @Body() dto: UpdateDispatchStateRequest) {
        return this.dispatchService.updateState(Number(id), dto.state);
    }
}
