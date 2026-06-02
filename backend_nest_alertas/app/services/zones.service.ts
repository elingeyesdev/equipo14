import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Zone } from 'app/models/zone.entity';
import { CreateZoneRequest } from 'app/http/requests/zones/request';
import { ZoneResponse } from 'app/http/requests/zones/response';

@Injectable()
export class ZonesService {
    constructor(
        @InjectRepository(Zone)
        private readonly zonesRepository: Repository<Zone>,
    ) {}

    private closeRing(ring: number[][]): number[][] {
        const cleaned = ring.filter(
            (p) => Array.isArray(p) && p.length >= 2 && Number.isFinite(p[0]) && Number.isFinite(p[1]),
        );
        if (cleaned.length < 3) {
            throw new BadRequestException('Se requieren al menos 3 vértices para demarcar una zona');
        }
        const first = cleaned[0];
        const last = cleaned[cleaned.length - 1];
        if (first[0] !== last[0] || first[1] !== last[1]) {
            cleaned.push([first[0], first[1]]);
        }
        return cleaned;
    }

    async findAll(): Promise<ZoneResponse[]> {
        const zones = await this.zonesRepository.find({ order: { name: 'ASC' } });
        return ZoneResponse.fromList(zones);
    }

    async create(dto: CreateZoneRequest): Promise<ZoneResponse> {
        const ring = this.closeRing(dto.coordinates);
        const zone = this.zonesRepository.create({
            name: dto.name.trim(),
            color: dto.color?.trim() || '#3b82f6',
            boundary: {
                type: 'Polygon',
                coordinates: [ring],
            },
        });
        const saved = await this.zonesRepository.save(zone);
        return ZoneResponse.fromEntity(saved);
    }

    async remove(id: number): Promise<{ message: string }> {
        const result = await this.zonesRepository.delete(id);
        if (!result.affected) {
            throw new NotFoundException(`Zona con ID ${id} no encontrada`);
        }
        return { message: 'Zona eliminada correctamente' };
    }

    async findNameContainingPoint(longitude: number, latitude: number): Promise<string | null> {
        const row = await this.zonesRepository
            .createQueryBuilder('zone')
            .select('zone.name', 'name')
            .where(
                `ST_Contains(
                    zone.boundary,
                    ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography
                )`,
                { longitude, latitude },
            )
            .orderBy('zone.id', 'ASC')
            .limit(1)
            .getRawOne<{ name: string }>();

        return row?.name ?? null;
    }
}
