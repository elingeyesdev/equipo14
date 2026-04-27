import { Module, Global } from '@nestjs/common';
import { NotificationsService } from 'app/services/notifications.service';

@Global()
@Module({
    providers: [NotificationsService],
    exports: [NotificationsService],
})
export class NotificationsModule {}
