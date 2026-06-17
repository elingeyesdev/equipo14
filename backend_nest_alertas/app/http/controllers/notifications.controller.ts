import { Body, Controller, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from 'app/decorators/roles.decorator';
import { NotificationsService } from 'app/services/notifications.service';
import { NotifyRouteRequest } from '../requests/notifications/request';

@ApiBearerAuth()
@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) {}

    @Post('notify-route')
    @Roles('autoridad', 'admin')
    notifyRoute(@Body() dto: NotifyRouteRequest, @Req() req: { user: { id: string } }) {
        return this.notificationsService.notifyUsersAlongRoute({
            route: dto.route,
            excludeUserId: req.user.id,
            incidentType: dto.incidentType,
            description: dto.description,
            reportId: dto.reportId,
        });
    }
}
