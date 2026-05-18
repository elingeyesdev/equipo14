import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'app/models/user.entity';
import { NotificationsService } from 'app/services/notifications.service';

@Global()
@Module({
    imports: [
        TypeOrmModule.forFeature([User]),
    ],
    providers: [NotificationsService],
    exports: [NotificationsService],
})
export class NotificationsModule {}
