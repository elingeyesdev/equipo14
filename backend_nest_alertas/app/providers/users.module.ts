import { Module } from '@nestjs/common';
import { UsersController } from '../http/controllers/users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from '../services/users.service';
import { User } from '../models/user.entity';
import { Role } from 'app/models/role.entity';
import { RolesGuard } from 'app/guards/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role])],
  controllers: [UsersController],
  providers: [UsersService, RolesGuard],
  exports: [UsersService],
})
export class UsersModule {}
