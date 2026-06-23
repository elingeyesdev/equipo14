import { IsString, IsNumber, IsEnum } from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import { InstallationType } from "app/enums/installation-type.enum";
import { EmergencyStation } from "app/models/emergency-station.entity";

export class CreateEmergencyStationRequest {
    @ApiProperty()
    @IsString({ message: 'El nombre debe ser una cadena de texto.' })
    name: string;

    @ApiProperty({ enum: InstallationType })
    @IsEnum(InstallationType, { message: 'El tipo de instalación no es válido.' })
    installation_type: InstallationType;

    @ApiProperty()
    @Type(() => Number)
    @IsNumber({}, { message: 'La latitud debe ser un número.' })
    latitude: number;

    @ApiProperty()
    @Type(() => Number)
    @IsNumber({}, { message: 'La longitud debe ser un número.' })
    longitude: number;

    toEmergencyStation(): EmergencyStation {
        const station = new EmergencyStation();
        station.name = this.name;
        station.installation_type = this.installation_type;
        station.location = {
            type: "Point",
            coordinates: [this.longitude, this.latitude]
        };
        return station;
    }
}

export class UpdateEmergencyStationRequest {
    @ApiProperty()
    @IsString({ message: 'El nombre debe ser una cadena de texto.' })
    name: string;
}
