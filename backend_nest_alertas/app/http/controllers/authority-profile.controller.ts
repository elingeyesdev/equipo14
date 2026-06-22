import { Body, Controller, Param, Patch } from '@nestjs/common';
import { AuthorityProfileService } from '../../services/authority-profile.service';
import { UpdateAuthorityProfileRequest } from '../requests/authority-profile/request';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth()
@Controller('authority-profile')
export class AuthorityProfileController {
    constructor(
        private readonly authorityProfileService: AuthorityProfileService
    ) {}

    @Patch(':id')
    async update(
        @Param('id') id: string,
        @Body() body: UpdateAuthorityProfileRequest
    ) {
        return this.authorityProfileService.updateByUserId(id, body);
    }
}
