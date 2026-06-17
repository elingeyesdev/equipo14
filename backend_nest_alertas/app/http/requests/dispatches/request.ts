import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';
import { StateType } from 'app/enums/state-type.enum';

export class CreateDispatchRequest {
    @ApiProperty()
    @IsNumber()
    reportId: number;

    @ApiProperty()
    @IsNumber()
    destinationId: number;

    @ApiProperty()
    @IsString()
    userId: string;
}

export class UpdateDispatchStateRequest {
    @ApiProperty({ enum: StateType })
    @IsString()
    state: StateType;
}
