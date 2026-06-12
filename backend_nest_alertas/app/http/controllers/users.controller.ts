import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { UsersService } from '../../services/users.service';
import { CreateUserRequest, UpdateLocationRequest, UpdateUserRequest } from '../requests/users/request';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from 'app/decorators/roles.decorator';
import { UserResponse } from '../requests/users/response';

@ApiBearerAuth()
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    // pensado para que el admin cree autoridades
    @Post()
    @Roles('admin')
    create(@Body() createUserDto: CreateUserRequest){
        return this.usersService.create(createUserDto)
        .then(UserResponse.FromUserToResponse);
    }

    @Get()
    @Roles('admin', 'autoridad')
    findAll(){
        return this.usersService.findAll()
    }

    @Get(':id')
    findOne(@Param('id') id:string){
        return this.usersService.findOne(id)
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateUserDto: UpdateUserRequest){
        return this.usersService.update(id, updateUserDto)
    }

    @Patch(':id/fcm-token')
    updateFcmToken(@Param('id') id: string, @Body('fcm_token') fcm_token: string) {
        return this.usersService.updateFcmToken(id, fcm_token);
    }

    @Patch(':id/location')
    updateLocation(@Param('id') id: string, @Body() body: UpdateLocationRequest) {
        return this.usersService.updateLocation(id, body);
    }

    @Delete(':id')
    @Roles('admin')
    remove(@Param('id') id: string){
        return this.usersService.remove(id)
    }
}
