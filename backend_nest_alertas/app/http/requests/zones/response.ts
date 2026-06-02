import { Zone } from 'app/models/zone.entity';

export class ZoneResponse {
    id: number;
    name: string;
    color: string;
    coordinates: number[][];
    created_at: Date;

    static fromEntity(zone: Zone): ZoneResponse {
        const response = new ZoneResponse();
        response.id = zone.id;
        response.name = zone.name;
        response.color = zone.color;
        response.coordinates = zone.boundary?.coordinates?.[0] ?? [];
        response.created_at = zone.created_at;
        return response;
    }

    static fromList(zones: Zone[]): ZoneResponse[] {
        return zones.map((z) => this.fromEntity(z));
    }
}
