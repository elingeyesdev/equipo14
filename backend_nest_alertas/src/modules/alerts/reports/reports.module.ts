import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/modules/users/entities/user.entity';
import { Report } from './entities/report.entity';
import { Image } from '../images/entities/image.entity';
import { ImagesModule } from '../images/images.module';

@Module({
  imports: [TypeOrmModule.forFeature([Report, User, Image]), ImagesModule],
  providers: [ReportsService],
  controllers: [ReportsController]
})
export class ReportsModule {}
