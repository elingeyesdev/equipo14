import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmergencyFacility } from 'app/models/emergency-facility.entity';
import { FacilityResponse } from 'app/http/requests/facilities/response';
import { FacilityType } from 'app/enums/facility_type.enum';
import { ProfileType } from 'app/enums/profile_type.enum';

const PROFILE_FACILITY_TYPES: Record<string, FacilityType[]> = {
    [ProfileType.Policia]: [FacilityType.Policia],
    [ProfileType.Bombero]: [FacilityType.Bombero],
    [ProfileType.Paramedico]: [FacilityType.Hospital, FacilityType.Ambulancia],
};

@Injectable()
export class FacilitiesService {
    constructor(
        @InjectRepository(EmergencyFacility)
        private readonly facilitiesRepository: Repository<EmergencyFacility>,
    ) {}

    async findAll(): Promise<FacilityResponse[]> {
        const facilities = await this.facilitiesRepository.find({
            order: { type: 'ASC', name: 'ASC' },
        });
        return FacilityResponse.fromList(facilities);
    }

    async findNearby(
        latitude: number,
        longitude: number,
        options: {
            profileType?: string;
            types?: string[];
            limit?: number;
        } = {},
    ): Promise<FacilityResponse[]> {
        const limit = Math.min(Math.max(options.limit ?? 8, 1), 30);
        let types = options.types?.filter(Boolean);

        if (!types?.length && options.profileType) {
            types = PROFILE_FACILITY_TYPES[options.profileType] ?? undefined;
        }

        const qb = this.facilitiesRepository
            .createQueryBuilder('facility')
            .addSelect(
                `ST_Distance(
                    facility.location,
                    ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography
                )`,
                'distance_meters',
            )
            .setParameters({ latitude, longitude })
            .orderBy('distance_meters', 'ASC')
            .limit(limit);

        if (types?.length) {
            qb.andWhere('facility.type IN (:...types)', { types });
        }

        const rows = await qb.getRawAndEntities();
        return rows.entities.map((facility, index) =>
            FacilityResponse.fromEntity(
                facility,
                Number(rows.raw[index]?.distance_meters ?? 0),
            ),
        );
    }
}
