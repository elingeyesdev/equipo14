import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthorityProfile } from "app/models/authority-profile.entity";
import { AuthorityProfileService } from "app/services/authority-profile.service";

@Module({
    imports: [TypeOrmModule.forFeature([AuthorityProfile])],
    providers: [AuthorityProfileService],
    exports: [AuthorityProfileService]
})
export class AuthorityProfileModule{}