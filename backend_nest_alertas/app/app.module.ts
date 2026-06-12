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
import { NotificationsModule } from './providers/notifications.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtStrategy } from './guards/strategies/jwt.strategy';
import { JwtGuard } from './guards/jwt.guard';
import { ScheduleModule } from '@nestjs/schedule';
import { CommentsModule } from './providers/comments.module';
import { ZonesModule } from './providers/zones.module';
import { RoleGuard } from './guards/roles.guard';
import { AuthorityProfileModule } from './providers/authority-profile.module';


@Module({
  imports: [
    ScheduleModule.forRoot(),
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
    AuthorityProfileModule,
    RolesModule,
    ReportsModule,
    CommentsModule,
    ImagesModule,
    ReportTypesModule,
    NotificationsModule,
    ZonesModule,
  ],
  controllers: [AppController],
  providers: [AppService,{
    provide: APP_GUARD,
    useClass: JwtGuard,
  },
  {
    provide: APP_GUARD,
    useClass: RoleGuard,
  },
  JwtStrategy,
],
})
export class AppModule {}
