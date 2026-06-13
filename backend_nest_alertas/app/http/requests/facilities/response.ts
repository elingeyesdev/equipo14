import { EmergencyFacility } from 'app/models/emergency-facility.entity';

export class FacilityResponse {
    id: number;
    name: string;
    type: string;
    address: string | null;
    latitude: number;
    longitude: number;
    distance_meters?: number;

    static fromEntity(facility: EmergencyFacility, distanceMeters?: number): FacilityResponse {
        const [longitude, latitude] = facility.location.coordinates;
        const response = new FacilityResponse();
        response.id = facility.id;
        response.name = facility.name;
        response.type = facility.type;
        response.address = facility.address ?? null;
        response.latitude = latitude;
        response.longitude = longitude;
        if (distanceMeters != null) {
            response.distance_meters = Math.round(distanceMeters);
        }
        return response;
    }

    static fromList(facilities: EmergencyFacility[]): FacilityResponse[] {
        return facilities.map((f) => this.fromEntity(f));
    }
}
