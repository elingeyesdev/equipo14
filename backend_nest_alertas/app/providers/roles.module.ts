import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RolesController } from "app/http/controllers/roles.controller";
import { Role } from "app/models/role.entity";
import { RolesService } from "app/services/roles.service";

@Module({
    imports: [TypeOrmModule.forFeature([Role])],
    providers: [RolesService],
    controllers: [RolesController]
})
export class RolesModule{}