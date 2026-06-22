import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsEnum, IsOptional, IsString } from "class-validator";
import { Transform } from "class-transformer";
import { ProfileType } from "app/enums/profile_type.enum";

export class UpdateAuthorityProfileRequest {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: 'El CI debe ser una cadena de texto.' })
    @Transform(({ value }) => value?.trim())
    ci?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsEmail({}, { message: 'Debe ingresar un correo electrónico válido.' })
    @Transform(({ value }) => value?.trim().toLowerCase())
    gmail?: string;

    @ApiProperty({
        enum: ProfileType,
        required: false,
    })
    @IsOptional()
    @IsEnum(ProfileType, { message: 'El tipo de perfil no es válido.' })
    profile_type?: ProfileType;
}
