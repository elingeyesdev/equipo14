import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from "@nestjs/config"
import {TypeOrmModule} from '@nestjs/typeorm'
import { UsersModule } from './providers/users.module';
import { ReportsModule } from './providers/reports.module';
import { ImagesModule } from './providers/images.module';
import appConfig from 'config/app.config';
import jwtConfig from 'config/jwt.config';
import databaseConfig from 'config/database.config';
import { ReportTypesModule } from './providers/report-types.module';
import { AuthModule } from './providers/auth.module';
import { RolesModule } from './providers/roles.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig]
    }),
    //configuracion dinamica mediante otros servicios, en nuestro caso los config
    //el forRoot usado antes configura todo aqui directamente con valores estaticos
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        configService.get('database')!,
    }),

    AuthModule,
    UsersModule,
    RolesModule,
    ReportsModule,
    ImagesModule,
    ReportTypesModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
