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
        cloudinary.config({
        cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
        api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
        api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
    }

    async uploadToCloudinary(file: Express.Multer.File): Promise<{
        url?: string
        public_id?: string
    }>{
        return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { folder: 'prueba',
                    transformation: [{
                        width:1200,
                        crop: 'limit'    
                    },
                    {
                        fetch_format: 'webp',
                        quality: 'auto:good',
                    }
                ]
                },
                (error, result) => {
                    if (error) return reject(error);
                    resolve({
                        url: result?.secure_url,
                        public_id: result?.public_id
                    })
                }
            );

            stream.end(file.buffer);
        });
    }

    async create(report: Report, file: Express.Multer.File) {
        const result = await this.uploadToCloudinary(file)

        const newImage = this.imagesRepository.create({
            cloudinary_id: result.public_id,
            report: report,
            uploaded_at: new Date(),
            url: result.url
        })

        return await this.imagesRepository.save(newImage);
    }
}
