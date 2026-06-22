import { Repository } from 'typeorm';
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from 'app/models/user.entity';
import { AuthorityProfile } from 'app/models/authority-profile.entity';
import { UpdateAuthorityProfileRequest } from 'app/http/requests/authority-profile/request';
import { AuthorityProfileResponse } from 'app/http/requests/authority-profile/response';

@Injectable()
export class AuthorityProfileService {
    constructor(
        @InjectRepository(AuthorityProfile)
        private authProfileRepository: Repository<AuthorityProfile>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) {}

    async create(authProfile: AuthorityProfile, user: User){
        authProfile.user = user
        return await this.authProfileRepository.save(authProfile)
    }

    async updateByUserId(userId: string, updateDto: UpdateAuthorityProfileRequest) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['authority_profile'],
        });

        if (!user) {
            throw new NotFoundException(`El user con ID ${userId} no se encontro`);
        }

        const profile = user.authority_profile;
        if (!profile) {
            throw new NotFoundException(`El perfil de autoridad para el usuario con ID ${userId} no se encontro`);
        }

        Object.assign(profile, updateDto);
        const updatedProfile = await this.authProfileRepository.save(profile);

        return AuthorityProfileResponse.FromAuthorityProfileToResponse(updatedProfile);
    }
}