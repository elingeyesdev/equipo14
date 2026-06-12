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
import {
    LOCKOUT_MINUTES,
    MAX_FAILED_LOGIN_ATTEMPTS,
    PUBLIC_REGISTER_ROLE_ID,
} from "app/constants/security.constants";

@Injectable()
export class AuthService{
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        private usersService: UsersService,
        private jwtService: JwtService,
        private readonly configService: ConfigService
    ) {}

    async validateUser(phone: string, password: string){
        const user = await this.usersRepository.findOne({
            where: { phone },
            relations: ['role'],
        });

        if(!user){
            throw new NotFoundException('usuario no encontrado')
        }

        if (user.locked_until && user.locked_until > new Date()) {
            const mins = Math.ceil(
                (user.locked_until.getTime() - Date.now()) / 60000,
            );
            throw new BadRequestException(
                `Cuenta bloqueada. Intenta de nuevo en ${mins} minuto(s).`,
            );
        }

        const isMatch: boolean = bcrypt.compareSync(password, user.password);

        if(!isMatch) {
            user.failed_login_attempts = (user.failed_login_attempts ?? 0) + 1;
            if (user.failed_login_attempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
                user.failed_login_attempts = 0;
                user.locked_until = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
            }
            await this.usersRepository.save(user);
            throw new BadRequestException('Contrasena Incorrecta')
        }

        user.failed_login_attempts = 0;
        user.locked_until = null;
        await this.usersRepository.save(user);

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
        const savedUser = await this.usersRepository.save(user)

        return { 
            access_token : access_token,
            refresh_token : refreshToken,
            user: UserResponse.FromUserToResponse(savedUser)
        }
    }

    async register(createUserDto: CreateUserRequest){
        createUserDto.roleId = PUBLIC_REGISTER_ROLE_ID;
        const existingUser = await this.usersService.create(createUserDto)
        return this.login(existingUser)
    }

    async refreshToken(token: string){
        const payload = this.jwtService.verify(token)

        const user = await this.usersRepository.findOneBy({ id: payload.id })
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

    async logout(id: string) {
        const user = await this.usersRepository.findOneBy({ id });

        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        }

        user.refresh_token = '';

        await this.usersRepository.save(user);

        return {
            message: 'Logout exitoso'
        };
    }
}
