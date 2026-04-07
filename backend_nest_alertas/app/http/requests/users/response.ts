import { User } from "app/models/user.entity";

export class UserResponse {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;

    static FromUserToResponse(user: User): UserResponse {
        const response = new UserResponse();

        response.id = user.id
        response.first_name = user.first_name
        response.last_name = user.last_name
        response.phone = user.phone

        return response
    }

    static FromUserListToResponse(users: User[]): UserResponse[]{
        return users.map(user => this.FromUserToResponse(user));
    }
}