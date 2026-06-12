import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength } from "class-validator";

export class CreateCommentRequest {
    /** Ignorado: el backend usa el JWT */
    @ApiProperty({ required: false, deprecated: true })
    @IsOptional()
    @IsString()
    creatorId?: string;

    @ApiProperty()
    @MaxLength(250)
    text: string;
}
