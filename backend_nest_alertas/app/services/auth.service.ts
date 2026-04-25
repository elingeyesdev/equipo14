import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { UsersService } from "./users.service";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from 'bcrypt';
import { User } from "app/models/user.entity";
import { CreateUserRequest } from "app/http/requests/users/request";
import { UserResponse } from "app/http/requests/users/response";

@Injectable()
export class AuthService{
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService
    ) {}
    async validateUser(phone: string, password: string){
        const user = await this.usersService.findByPhone(phone);
        if(!user){
            throw new NotFoundException('usuario no encontrado')
        }
        const isMatch: boolean = bcrypt.compareSync(password, user.password);
        if(!isMatch) throw new BadRequestException('Contrasena Incorrecta')

        console.log("usurio extraido de la validacion: " + user.first_name)
        return user;
    }

    async login(user: User){
        const payload = { phone: user.phone, id: user.id}
        return { 
            access_token: this.jwtService.sign(payload) , 
            user: UserResponse.FromUserToResponse(user)
        }
    }

    async register(CreateUserRequest: CreateUserRequest){
        const existingUser = await this.usersService.create(CreateUserRequest)
        return this.login(existingUser)
    }
}