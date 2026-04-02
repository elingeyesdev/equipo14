import { Module } from '@nestjs/common';
import { ImagesService } from './images.service';
import { ImagesController } from './images.controller';
import { Report } from '../reports/entities/report.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Image } from './entities/image.entity';
import { ConfigModule } from '@nestjs/config';
import { CloudinaryService } from '../../../config/cloudinary.service';

@Module({
  imports: [TypeOrmModule.forFeature([Report, Image]), ConfigModule],
  providers: [CloudinaryService, ImagesService],
  controllers: [ImagesController],
  exports: [ImagesService, CloudinaryService],
})
export class ImagesModule {}
