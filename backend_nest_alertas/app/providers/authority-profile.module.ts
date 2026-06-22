import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthorityProfile } from "app/models/authority-profile.entity";
import { AuthorityProfileService } from "app/services/authority-profile.service";
import { User } from "app/models/user.entity";
import { AuthorityProfileController } from "../http/controllers/authority-profile.controller";

@Module({
    imports: [TypeOrmModule.forFeature([AuthorityProfile, User])],
    controllers: [AuthorityProfileController],
    providers: [AuthorityProfileService],
    exports: [AuthorityProfileService]
})
export class AuthorityProfileModule{}