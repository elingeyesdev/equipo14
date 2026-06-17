import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'app/models/user.entity';
import { NotificationsService } from 'app/services/notifications.service';
import { NotificationsController } from 'app/http/controllers/notifications.controller';

@Global()
@Module({
    imports: [
        TypeOrmModule.forFeature([User]),
    ],
    controllers: [NotificationsController],
    providers: [NotificationsService],
    exports: [NotificationsService],
})
export class NotificationsModule {}
