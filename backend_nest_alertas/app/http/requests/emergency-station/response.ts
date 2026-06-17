import { EmergencyStation } from 'app/models/emergency-station.entity';

export class EmergencyStationResponse {
    id: number;
    name: string;
    installation_type: string;
    coordinates: number[];
    distance_meters?: number;

    static FromEmergencyStationToResponse(station: EmergencyStation, distanceMeters?: number): EmergencyStationResponse {
        const response = new EmergencyStationResponse();
        response.id = station.id;
        response.name = station.name;
        response.installation_type = station.installation_type;
        response.coordinates = station.location.coordinates;
        if (distanceMeters != null) {
            response.distance_meters = Math.round(distanceMeters);
        }
        return response;
    }

    static FromEmergencyStationListToResponse(stations: EmergencyStation[]): EmergencyStationResponse[] {
        if (!stations?.length) return [];
        return stations.map((station) => this.FromEmergencyStationToResponse(station));
    }
}
