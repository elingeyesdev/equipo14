import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../models/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt'
import { UserResponse } from '../http/requests/users/response';
import { CreateAuthorityUserRequest, CreateUserRequest, UpdateLocationRequest, UpdateUserRequest, UpdatePasswordRequest } from 'app/http/requests/users/request';
import { Role } from 'app/models/role.entity';
import { AuthorityProfileService } from './authority-profile.service';
import { MailService } from './mail.service';

@Injectable()
export class UsersService {
    constructor(
        private authProfileService: AuthorityProfileService,
        @InjectRepository(User) 
        private usersRepository: Repository<User>,
        @InjectRepository(Role)
        private rolesRepository: Repository<Role>,
        private mailService: MailService,
    ) {}

    async create(createUserRequest: CreateUserRequest){
        const role = await this.rolesRepository.findOne({where: {id: createUserRequest.roleId}})
        if(!role){
            throw new NotFoundException("Rol no encontrado")
        }
        const createUser = createUserRequest.toUser();

        const existPhone = await this.usersRepository.findOne({
            where: {phone: createUser.phone}
        });
        if (existPhone){
            throw new BadRequestException(`Ya hay un usuario registrado con el numero "${createUser.phone}"`)
        }

        const hashPassword = await bcrypt.hash(createUser.password, 12)

        const newUser = this.usersRepository.create({
            ...createUser,
            password: hashPassword,
            role: role
        })

        const savedUser = await this.usersRepository.save(newUser);

        return savedUser;
    }

    async createAuthUser(createAuthUserRequest: CreateAuthorityUserRequest){
        const newUser = await this.create(createAuthUserRequest)
        if (!newUser){
            throw new BadRequestException("Error al craer el usuario")
        }
        const createAuthProfile = createAuthUserRequest.toAuthorityProfile()
        const newAuthProfile = await this.authProfileService.create(createAuthProfile, newUser)

        newUser.authority_profile = newAuthProfile

        await this.mailService.sendUserCredentials(
            createAuthUserRequest.gmail,
            createAuthUserRequest.phone,
            createAuthUserRequest.password,
        );

        return UserResponse.FromUserToResponse(newUser)
    }

    async findAll(){
        const users = await this.usersRepository.find({
            relations: ['role', 'authority_profile'],
        });
        return UserResponse.FromUserListToResponse(users)
    }

    async findOne(id: string){
        const user = await this.usersRepository.findOne({
            where: { id },
            relations: ['role', 'authority_profile'],
        });

        if(!user){
            throw new NotFoundException(`El user con ID ${id} no se encontro`)
        }
        return UserResponse.FromUserToResponse(user)
    }

    async findByPhone(phone: string){
        return this.usersRepository.findOne({
            where: {phone},
            relations: ['role', 'authority_profile'],
        })
    }

    async update(id: string, updateUserDto: UpdateUserRequest){
        const user = await this.usersRepository.findOne({
            where: { id },
            relations: ['role', 'authority_profile'],
        });
        
        if(!user){
            throw new NotFoundException(`El user con ID ${id} no se encontro`)
        }
        Object.assign(user, updateUserDto);
        const updateUser = await this.usersRepository.save(user)
        return UserResponse.FromUserToResponse(updateUser)
    }

    async updateFcmToken(id: string, fcm_token: string) {
        const user = await this.usersRepository.findOneBy({ id });
        if (!user) {
            throw new NotFoundException(`El user con ID ${id} no se encontró`);
        }
        user.fcm_token = fcm_token;
        await this.usersRepository.save(user);
        return { message: "Token FCM actualizado correctamente" };
    }

    async updateLocation(id: string, location: UpdateLocationRequest) {
        const user = await this.usersRepository.findOneBy({ id });
        if (!user) {
            throw new NotFoundException(`El user con ID ${id} no se encontró`);
        }
        
        user.last_location = {
            type: 'Point',
            coordinates: [location.longitude, location.latitude],
        };
        
        await this.usersRepository.save(user);
        return { message: "Ubicación actualizada correctamente" };
    }

    async updatePassword(id: string, updatePasswordDto: UpdatePasswordRequest) {
        const user = await this.usersRepository.findOne({
            where: { id }
        });

        if(!user){
            throw new NotFoundException(`El user con ID ${id} no se encontro`)
        }

        const isMatch = await bcrypt.compare(updatePasswordDto.current_password, user.password);
        if(!isMatch) {
            throw new BadRequestException("La contraseña actual es incorrecta");
        }

        const hashPassword = await bcrypt.hash(updatePasswordDto.new_password, 12);
        user.password = hashPassword;
        await this.usersRepository.save(user);

        return { message: "contrasena actualizada correctamente" };
    }

    async remove(id: string){
        const result = await this.usersRepository.delete(id);

        if(result.affected === 0){
            throw new NotFoundException(`El user con ID ${id} no se encontro`)
        }
        return { message: "Usuario eliminado correctamente" };
    }
}
