import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

@Injectable()
export class RoleGuard implements CanActivate {
    constructor(
        private reflector: Reflector
    ){}

    canActivate(context: ExecutionContext): boolean {
        const roles = this.reflector.getAllAndOverride<string[]>(
            'roles',[
                context.getHandler(),
                context.getClass(),
            ]
        );
        if (!roles) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;
        return roles.includes(user.role.name);
    }
}