import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from './decorators/roles.decorator';

@ApiBearerAuth()
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Roles('admin')
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
