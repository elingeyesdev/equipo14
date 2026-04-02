import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

function readCloudinaryEnv(config: ConfigService) {
  const cloud_name = config.get<string>('CLOUDINARY_CLOUD_NAME')?.trim();
  const api_key = config.get<string>('CLOUDINARY_API_KEY')?.trim();
  const api_secret = config.get<string>('CLOUDINARY_API_SECRET')?.trim();
  if (!cloud_name || !api_key || !api_secret) {
    throw new Error(
      'Faltan CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY o CLOUDINARY_API_SECRET en .env',
    );
  }
  return { cloud_name, api_key, api_secret };
}

/**
 * Subida a Cloudinary usando solo variables de entorno (sin credenciales en código).
 * Devuelve la URL HTTPS (`secure_url`) para guardar en PostgreSQL.
 */
@Injectable()
export class CloudinaryService {
  constructor(private readonly config: ConfigService) {
    cloudinary.config(readCloudinaryEnv(this.config));
  }

  async uploadImage(file: Express.Multer.File): Promise<string> {
    if (!file?.buffer?.length) {
      throw new Error('Archivo vacío o sin buffer en memoria');
    }

    const folder = this.config.get<string>('CLOUDINARY_FOLDER', 'alertas');

    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'image' },
        (error: Error | undefined, result: UploadApiResponse | undefined) => {
          if (error) return reject(error);
          const url = result?.secure_url;
          if (!url) {
            return reject(new Error('Cloudinary no devolvió secure_url'));
          }
          resolve(url);
        },
      );
      stream.end(file.buffer);
    });
  }
}
