import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateZoneRequest {
    @ApiProperty({ example: 'Equipetrol' })
    @IsString()
    @MaxLength(120)
    name: string;

    @ApiProperty({ required: false, example: '#3b82f6' })
    @IsOptional()
    @IsString()
    @MaxLength(20)
    color?: string;

    /** Anillo exterior [[lng, lat], ...] — se cierra automáticamente si hace falta */
    @ApiProperty({
        example: [
            [-63.18, -17.78],
            [-63.17, -17.78],
            [-63.17, -17.77],
            [-63.18, -17.77],
        ],
    })
    @IsArray()
    @ArrayMinSize(3)
    coordinates: number[][];
}
