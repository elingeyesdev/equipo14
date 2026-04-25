import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { UsersService } from '../../services/users.service';
import { UpdateUserRequest } from '../requests/users/request';



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

    @Delete(':id')
    remove(@Param('id') id: string){
        return this.usersService.remove(id)
    }
}
