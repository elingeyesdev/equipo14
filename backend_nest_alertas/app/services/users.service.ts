import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../models/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt'

import { UserResponse } from '../http/requests/users/response';
import { CreateUserRequest, UpdateLocationRequest, UpdateUserRequest } from 'app/http/requests/users/request';
import { Role } from 'app/models/role.entity';

/** roleId permitidos al crear desde el panel (por rol del solicitante) */
const CREATABLE_BY_AUTORIDAD = new Set([1, 2]);
const CREATABLE_BY_ADMIN = new Set([1, 2, 3]);
const PUBLIC_REGISTER_ROLE_ID = 1;

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User) 
        private usersRepository: Repository<User>,
        @InjectRepository(Role)
        private rolesRepository: Repository<Role>,
    ) {}

    assertCanAssignRole(requesterRole: Role | undefined, targetRoleId: number): void {
        const name = (requesterRole?.name ?? '').toLowerCase();
        let allowed: Set<number>;

        if (name === 'admin') {
            allowed = CREATABLE_BY_ADMIN;
        } else if (name === 'autoridad') {
            allowed = CREATABLE_BY_AUTORIDAD;
        } else {
            throw new ForbiddenException('No tiene permisos para crear usuarios');
        }

        if (!allowed.has(targetRoleId)) {
            throw new ForbiddenException('No puede asignar ese rol');
        }
    }

    async create(CreateUserRequest: CreateUserRequest, requesterRole?: Role) {
        if (requesterRole) {
            this.assertCanAssignRole(requesterRole, CreateUserRequest.roleId);
        } else if (CreateUserRequest.roleId !== PUBLIC_REGISTER_ROLE_ID) {
            throw new BadRequestException(
                'El registro público solo permite usuarios normales',
            );
        }

        const role = await this.rolesRepository.findOne({
            where: { id: CreateUserRequest.roleId },
        });
        if (!role) {
            throw new NotFoundException('Rol no encontrado');
        }

        const createUser = CreateUserRequest.toUser();

        const existPhone = await this.usersRepository.findOne({
            where: { phone: createUser.phone },
        });
        if (existPhone) {
            throw new BadRequestException(
                `Ya hay un usuario registrado con el numero "${createUser.phone}"`,
            );
        }

        const hashPassword = await bcrypt.hash(createUser.password, 12);

        const newUser = this.usersRepository.create({
            ...createUser,
            password: hashPassword,
            role: role,
        });

        const savedUser = await this.usersRepository.save(newUser);
        const withRole = await this.usersRepository.findOne({
            where: { id: savedUser.id },
            relations: ['role'],
        });

        return UserResponse.FromUserToResponse(withRole!);
    }

    async findAll(){
        const users = await this.usersRepository.find({
            relations: ['role'],
        });
        return UserResponse.FromUserListToResponse(users)
    }

    async findOne(id: string){
        const user = await this.usersRepository.findOne({
            where: { id },
            relations: ['role'],
        });

        if(!user){
            throw new NotFoundException(`El user con ID ${id} no se encontro`)
        }
        return UserResponse.FromUserToResponse(user)
    }

    async findByPhone(phone: string){
        return this.usersRepository.findOne({
            where: {phone},
            relations: ['role'],
        })
    }

    async update(id: string, updateUserDto: UpdateUserRequest){
        const user = await this.usersRepository.findOneBy({ id });
        
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

    async remove(id: string){
        const result = await this.usersRepository.delete(id);

        if(result.affected === 0){
            throw new NotFoundException(`El user con ID ${id} no se encontro`)
        }
        return { message: "Usuario eliminado correctamente" };
    }
}
