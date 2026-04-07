import { Module } from '@nestjs/common';
import { ReportsService } from '../services/reports.service';
import { ReportsController } from '../http/controllers/reports.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImagesModule } from './images.module';
import { Report } from 'app/models/report.entity';
import { User } from 'app/models/user.entity';
import { Image } from 'app/models/image.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Report, User, Image]), ImagesModule],
  providers: [ReportsService],
  controllers: [ReportsController]
})
export class ReportsModule {}
