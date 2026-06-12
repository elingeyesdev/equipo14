import { ApiProperty } from "@nestjs/swagger";
import { IsString, MaxLength } from "class-validator";

export class CreateCommentRequest {
    @ApiProperty()
    @IsString()
    creatorId: string;

    @ApiProperty()
    @MaxLength(250)
    text: string;
}