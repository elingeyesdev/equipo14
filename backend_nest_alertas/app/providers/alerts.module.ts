import { Module } from '@nestjs/common';
import { ReportsModule } from './reports.module';
import { ImagesModule } from './images.module';


@Module({
    imports: [ReportsModule, ImagesModule]
})
export class AlertsModule {}
