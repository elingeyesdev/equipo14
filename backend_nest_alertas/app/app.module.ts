import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from "@nestjs/config"
import {TypeOrmModule} from '@nestjs/typeorm'
import { UsersModule } from './providers/users.module';
import { ReportsModule } from './providers/reports.module';
import { ImagesModule } from './providers/images.module';
import { AlertsModule } from './providers/alerts.module';
import appConfig from 'config/app.config';
import databaseConfig from 'config/database.config';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig]
    }),
    //configuracion dinamica mediante otros servicios, en nuestro caso los config
    //el forRoot usado antes configura todo aqui directamente con valores estaticos
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        configService.get('database')!,
    }),

    UsersModule,
    ReportsModule,
    ImagesModule,
    AlertsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
