import { Module } from '@nestjs/common';
import { ReportsService } from '../services/reports.service';
import { ReportsController } from '../http/controllers/reports.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImagesModule } from './images.module';
import { Report } from 'app/models/report.entity';
import { User } from 'app/models/user.entity';
import { Image } from 'app/models/image.entity';
import { ReportType } from 'app/models/report-types.entity';
import { CommentsModule } from './comments.module';
import { ReportsCleanup } from 'app/schedulers/reports_cleanup.job';

@Module({
  imports: [TypeOrmModule.forFeature([Report, User, Image, ReportType]), ImagesModule, CommentsModule],
  providers: [ReportsService, ReportsCleanup],
  controllers: [ReportsController]
})
export class ReportsModule {}
