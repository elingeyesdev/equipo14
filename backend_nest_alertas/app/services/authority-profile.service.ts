import { Repository } from 'typeorm';
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from 'app/models/user.entity';
import { AuthorityProfile } from 'app/models/authority-profile.entity';

@Injectable()
export class AuthorityProfileService {
    constructor(
        @InjectRepository(AuthorityProfile)
        private authProfileRepository: Repository<AuthorityProfile>
    ) {}

    async create(authProfile: AuthorityProfile, user: User){
        authProfile.user = user
        return await this.authProfileRepository.save(authProfile)
    }
}