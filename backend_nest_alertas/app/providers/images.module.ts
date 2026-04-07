import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { ConfigModule } from '@nestjs/config';
import { Report } from 'app/models/report.entity';
import { Image } from 'app/models/image.entity';
import { ImagesService } from 'app/services/images.service';
import { ImagesController } from 'app/http/controllers/images.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Report, Image]), ConfigModule],
  providers: [ImagesService],
  controllers: [ImagesController],
  exports: [ImagesService],
})
export class ImagesModule {}
