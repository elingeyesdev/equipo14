import { Role } from "app/models/role.entity";
import { User } from "app/models/user.entity";

export class UserResponse {
    id: string;
    role: Role;
    first_name: string;
    last_name: string;
    phone: string;
    authority_profile: {
        ci: string;
        gmail: string;
        profile_type: string
    } | null

    static FromUserToResponse(user: User): UserResponse {
        const response = new UserResponse();

        response.id = user.id
        response.role = user.role
        response.first_name = user.first_name
        response.last_name = user.last_name
        response.phone = user.phone
        response.authority_profile = user.authority_profile ? {
            ci: user.authority_profile.ci,
            gmail: user.authority_profile.gmail,
            profile_type: user.authority_profile.profile_type,
        } : null;

        return response
    }

    static FromUserListToResponse(users: User[]): UserResponse[]{
        return users.map(user => this.FromUserToResponse(user));
    }
}