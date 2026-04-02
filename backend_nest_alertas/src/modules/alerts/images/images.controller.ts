import { Controller } from '@nestjs/common';

/**
 * Las imágenes se asocian a reportes desde `POST /reports` (multipart).
 * No hay rutas REST adicionales aquí.
 */
@Controller('images')
export class ImagesController {}