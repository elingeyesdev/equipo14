import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from "@nestjs/config"
import {TypeOrmModule} from '@nestjs/typeorm'
import { UsersModule } from './modules/users/users.module';
import { ReportsModule } from './modules/alerts/reports/reports.module';
import { ImagesModule } from './modules/alerts/images/images.module';
import { AlertsModule } from './modules/alerts/alerts.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST,
      port: +`${process.env.DATABASE_PORT}`,
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      entities: ['**/entity/*.entity{.ys,.js}'],
      synchronize: true,
      autoLoadEntities: true,
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
