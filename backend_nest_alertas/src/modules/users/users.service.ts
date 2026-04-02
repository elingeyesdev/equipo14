import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CreateUserRequest, UpdateUserRequest } from './dto/request';
import { UserResponse } from './dto/response';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(CreateUserRequest: CreateUserRequest) {
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
    });

    const savedUser = await this.usersRepository.save(newUser);

    return UserResponse.FromUserToResponse(savedUser);
  }

  async findAll() {
    const users = await this.usersRepository.find();
    return UserResponse.FromUserListToResponse(users);
  }

  async findOne(id: string) {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`El user con ID ${id} no se encontro`);
    }
    return UserResponse.FromUserToResponse(user);
  }

  async update(id: string, updateUserDto: UpdateUserRequest) {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`El user con ID ${id} no se encontro`);
    }

    Object.assign(user, updateUserDto);
    const updateUser = await this.usersRepository.save(user);

    return UserResponse.FromUserToResponse(updateUser);
  }

  async remove(id: string) {
    const result = await this.usersRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`El user con ID ${id} no se encontro`);
    }
    return { message: 'Usuario eliminado correctamente' };
  }
}
