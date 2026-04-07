import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from 'app/app.module';

export async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    const configService = app.get(ConfigService);

    // class-validator
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true
    }));

    // swagger
    const config = new DocumentBuilder()
    .addBearerAuth()
    .setTitle('API REST BACKEND NEST ')
    .setDescription('Esta es la api backend')
    .setVersion('1.0')
    .addTag('code')
    .build();
    const documentFactory = () => SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, documentFactory);

    app.enableCors();
    app.setGlobalPrefix(configService.get('app.apiPrefix')!);
    
    const port = configService.get('app.port');
    await app.listen(port)

    return app
}