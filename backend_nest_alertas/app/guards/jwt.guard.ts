import { Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";

// se puede anadir loica aqui para manejar de forma mas flexible la autenticacion del JWT
// el codigo comentado mas abajo permite poner endpoint publicos
// sera util? no lo se
// pero puede servir talvez mas adelante
// asi q lo dejare por aqui

// ### NO DEBE SER LIBERADO ###
@Injectable()
export class JwtGuard extends AuthGuard('jwt') {
    // constructor(private reflector: Reflector) {
    // super();
    // }
    // canActivate(context: ExecutionContext) {
    //     const isPublic = this.reflector.getAllAndOverride('isPublic', [
    //     context.getHandler(),
    //     context.getClass(),
    //     ]);

    //     if (isPublic) return true;

    //     return super.canActivate(context);
    // }
}