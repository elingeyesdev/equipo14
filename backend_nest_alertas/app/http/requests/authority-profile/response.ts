import { AuthorityProfile } from 'app/models/authority-profile.entity';

export class AuthorityProfileResponse {
    id: number;
    ci: string;
    gmail: string;
    profile_type: string;

    static FromAuthorityProfileToResponse(profile: AuthorityProfile): AuthorityProfileResponse {
        const response = new AuthorityProfileResponse();
        response.id = profile.id;
        response.ci = profile.ci;
        response.gmail = profile.gmail;
        response.profile_type = profile.profile_type;
        return response;
    }
}
