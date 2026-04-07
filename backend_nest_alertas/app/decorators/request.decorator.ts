import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { ReportTypes } from '../enums/report-type.enum';

// permite cargar archivos multimedia, en este caso imagenes
// todo llega como `text` o `file` no admite mas formatos
// presenta problemas al manejar numeros
// se removio el uso de una matriz para las coordenadas, es mas facil manejarlo asi o por lo menos da menos problemas

export function ApiImageUpload() {
    return applyDecorators(
        UseInterceptors(FileInterceptor('image')),
        ApiConsumes('multipart/form-data'),
        ApiBody({
            schema: {
                type: 'object',
                properties: {
                    image: {
                        type: 'string',
                        format: 'binary',
                    },
                    type: {
                        type: 'string',
                        enum: Object.values(ReportTypes),
                    },
                    description: {
                        type: 'string',
                    },
                    latitude: {
                        type: 'number'
                    },
                    longitude: {
                        type: 'number'
                    },
                    user: {
                        type: 'string',
                    },
                },
                required: ['image', 'type', 'description', 'user'],
            },
        }),
    );
}