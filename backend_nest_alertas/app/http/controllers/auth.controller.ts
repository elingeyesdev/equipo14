import { Body, Controller, Get, Post, Request, UseGuards } from "@nestjs/common";
import { AuthService } from "app/services/auth.service";
import { CreateUserRequest } from "../requests/users/request";
import { ApiBearerAuth, ApiBody } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { Public } from "app/decorators/public.decorator";
import { UserResponse } from "../requests/users/response";

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
    ){}

    @Public()
    @Post('/register')
    create(@Body() createUserDto: CreateUserRequest){
        return this.authService.register(createUserDto)
    }

    @Public()
    @UseGuards(AuthGuard('local'))
    @Post('/login')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                phone: {
                    type: 'string',
                },
                password: {
                    type: 'string',
                },
            },
        }
    })
    // detalle importante el UseGuards hace automaticamente req.(lo q se declare para devolver en el LocalStrategy)
    // por lo q no es necesario tipar
    // asi q tener cuidado en la linea del return de hacer coincidir esto
    // de no hacerlo va a regresar null
    // dato extra q puede ayudar q yo tampoco sabia xd
    // el Request a diferencia del Body devuelve todo el objeto http del request
    // el Body solo devuelve los datos enviados por el cliente anadidos el body de la consulta
    async login(@Request() req){
        return this.authService.login(req.user)
    }

    @Get('/me')
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    async me(@Request() req) {
        const u = req.user;
        if (u?.id && u?.phone) return u;
        return UserResponse.FromUserToResponse(u);
    }

    @Public()
    @Post('/refresh')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                refresh_token: {
                    type: 'string',
                },
            },
        }
    })
    async refresh(@Body('refresh_token') token: string){
        return this.authService.refreshToken(token)
    }
}