import { Module } from '@nestjs/common';
import { UsersController } from '../http/controllers/users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from '../services/users.service';
import { User } from '../models/user.entity';
import { Role } from 'app/models/role.entity';
import { RoleGuard } from 'app/guards/roles.guard';
import { AuthorityProfileModule } from './authority-profile.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role]), AuthorityProfileModule],
  controllers: [UsersController],
  providers: [UsersService, RoleGuard],
  exports: [UsersService],
})
export class UsersModule {}
