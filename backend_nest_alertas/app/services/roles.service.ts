import { Injectable, NotFoundException } from "@nestjs/common";
import { Role } from "app/models/role.entity";
import { Repository } from "typeorm";
import { InjectRepository } from '@nestjs/typeorm';
import { NotFoundError } from "rxjs";

@Injectable()
export class RolesService {
    constructor(
        @InjectRepository(Role) 
        private rolesRepository: Repository<Role>
    ) {}

    async create(name: string){
        const newRole = this.rolesRepository.create({
            name: name
        });

        const saveRole = await this.rolesRepository.save(newRole)

        return saveRole;
    }

    async findAll(){
        const roles = await this.rolesRepository.find()
        return roles
    }

    async remove(id: number){
        const result = await this.rolesRepository.delete(id);

        if(result.affected === 0){
            throw new NotFoundException(`El rol con ID ${id} no se encontro`)
        }
        return { message: "Rol eliminado correctamente"}
    }
}