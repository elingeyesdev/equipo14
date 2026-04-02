import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Report } from '../reports/entities/report.entity';
import { Repository } from 'typeorm';
import { Image } from './entities/image.entity';
import { CloudinaryService } from '../../../config/cloudinary.service';

@Injectable()
export class ImagesService {
  constructor(
    @InjectRepository(Image)
    private imagesRepository: Repository<Image>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  /**
   * Sube el archivo a Cloudinary y guarda solo la URL en PostgreSQL.
   */
  async create(report: Report, file: Express.Multer.File) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Archivo de imagen requerido');
    }

    const imageUrl = await this.cloudinaryService.uploadImage(file);

    const newImage = this.imagesRepository.create({
      report,
      uploaded_at: new Date(),
      url: imageUrl,
    });

    return await this.imagesRepository.save(newImage);
  }
}
