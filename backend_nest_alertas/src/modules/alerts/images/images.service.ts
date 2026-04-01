import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Report } from '../reports/entities/report.entity';
import { Repository } from 'typeorm';
import { Image } from './entities/image.entity';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

@Injectable()
export class ImagesService {
    constructor(
        @InjectRepository(Image)
        private imagesRepository: Repository<Image>,
        private configService: ConfigService
    ){
        console.log('CLOUD NAME:', this.configService.get<string>('CLOUDINARY_CLOUD_NAME'));
        console.log('API KEY:', this.configService.get<string>('CLOUDINARY_API_KEY'));
        console.log('API SECRET:', this.configService.get<string>('CLOUDINARY_API_SECRET'));
        cloudinary.config({
        cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
        api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
        api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
    }

    async uploadToCloudinary(file: Express.Multer.File): Promise<string|undefined>{
        console.log('BUFFER ', file.buffer);
        console.log('CLOUD NAME:', this.configService.get<string>('CLOUDINARY_CLOUD_NAME'));
        console.log('API KEY:', this.configService.get<string>('CLOUDINARY_API_KEY'));
        console.log('API SECRET:', this.configService.get<string>('CLOUDINARY_API_SECRET'));
        return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { folder: 'prueba' },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result?.secure_url);
                }
            );

            stream.end(file.buffer);
        });
    }
    async create(report: Report, file: Express.Multer.File) {
        const imageUrl = await this.uploadToCloudinary(file)

        const newImage = this.imagesRepository.create({
            report: report,
            uploaded_at: new Date(),
            url: imageUrl
        })

        return await this.imagesRepository.save(newImage);
    }
}
