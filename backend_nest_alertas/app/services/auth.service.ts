import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { UsersService } from "./users.service";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from 'bcrypt';
import { User } from "app/models/user.entity";
import { CreateUserRequest } from "app/http/requests/users/request";
import { UserResponse } from "app/http/requests/users/response";
import { ConfigService } from "@nestjs/config";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";

@Injectable()
export class AuthService{
    constructor(
        @InjectRepository(User)
        private userssRepository: Repository<User>,
        private usersService: UsersService,
        private jwtService: JwtService,
        private readonly configService: ConfigService
    ) {}
    async validateUser(phone: string, password: string){
        const user = await this.usersService.findByPhone(phone);
        if(!user){
            throw new NotFoundException('usuario no encontrado')
        }
        const isMatch: boolean = bcrypt.compareSync(password, user.password);
        if(!isMatch) throw new BadRequestException('Contrasena Incorrecta')

        return user;
    }

    async login(user: User){
        const payload = { phone: user.phone, id: user.id}
        const refreshToken = this.jwtService.sign(payload, {
            expiresIn: this.configService.get('REFRESH_TOKEN_VALIDITY_DURATION_IN_HOURS')
        })
        const access_token = this.jwtService.sign(payload, {
            expiresIn: this.configService.get('ACCESS_TOKEN_VALIDITY_DURATION_IN_HOURS'),
        })

        const hashToken = await bcrypt.hash(refreshToken, 10);

        user.refresh_token = hashToken
        const savedUser = await this.userssRepository.save(user)

        return { 
            access_token : access_token,
            refresh_token : refreshToken,
            user: UserResponse.FromUserToResponse(savedUser)
        }
    }

    async register(CreateUserRequest: CreateUserRequest){
        const existingUser = await this.usersService.create(CreateUserRequest)
        return this.login(existingUser)
    }

    async refreshToken(token: string){
        const payload = this.jwtService.verify(token)

        const user = await this.userssRepository.findOneBy({ id: payload.id })
        if (!user){
            throw new NotFoundException("Usuario no encontrado")
        }

        const isMatch = await bcrypt.compare(token, user.refresh_token);
        if (!isMatch){
            throw new BadRequestException("Token invalido")
        }

        const newPayload = { id: user.id, phone: user.phone };

        const newAccessToken = this.jwtService.sign(newPayload, {
            expiresIn: this.configService.get('ACCESS_TOKEN_VALIDITY_DURATION_IN_HOURS'),
        })
        return { access_token: newAccessToken }
    }
}