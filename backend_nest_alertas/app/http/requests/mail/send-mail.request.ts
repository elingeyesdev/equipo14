import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class SendMailRequest {
    @ApiProperty()
    @IsString({ message: 'El asunto debe ser una cadena de texto.' })
    @IsNotEmpty({ message: 'El asunto no puede estar vacío.' })
    subject: string;

    @ApiProperty()
    @IsString({ message: 'El contenido debe ser una cadena de texto.' })
    @IsNotEmpty({ message: 'El contenido no puede estar vacío.' })
    content: string;
}
