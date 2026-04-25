import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from '@nestjs/passport';
import { AuthService } from "app/services/auth.service";
import { Strategy } from 'passport-local';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy){
    constructor(private authService: AuthService){
        super({
            usernameField: 'phone'
        })
    }

    async validate(phone: string, password: string){
        const user = await this.authService.validateUser(phone, password)
        if(!user) {
            throw new UnauthorizedException();
        }
        return user;
    }
}