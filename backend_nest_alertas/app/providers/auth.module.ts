import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { UsersModule } from "./users.module";
import { AuthService } from "app/services/auth.service";
import { JwtStrategy } from "app/guards/strategies/jwt.strategy";
import { AuthController } from "app/http/controllers/auth.controller";
import { User } from "app/models/user.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { LocalStrategy } from "app/guards/strategies/local.strategy";

@Module({
    imports: [
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                const jwt = configService.get('jwt')
                return {
                    secret: jwt.secret,
                };
            },
        }),
        TypeOrmModule.forFeature([User]),
        UsersModule,
    ],
    providers: [AuthService, JwtStrategy, LocalStrategy],
    controllers: [AuthController],
    exports: [AuthService, JwtModule],
})
export class AuthModule {}