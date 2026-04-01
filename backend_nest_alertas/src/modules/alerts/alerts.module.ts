import { Module } from '@nestjs/common';
import { ReportsModule } from './reports/reports.module';
import { ImagesModule } from './images/images.module';

@Module({
    imports: [ReportsModule, ImagesModule]
})
export class AlertsModule {}
