import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { UsersService } from '../../services/users.service';
import { UpdateLocationRequest, UpdateUserRequest } from '../requests/users/request';



@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Get()
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
    remove(@Param('id') id: string){
        return this.usersService.remove(id)
    }
}
