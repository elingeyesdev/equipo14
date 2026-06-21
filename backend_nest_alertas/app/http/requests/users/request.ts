import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsEmail, IsEnum, IsNumber, IsNumberString, IsOptional, IsString, Length, Matches, MaxLength, MinLength } from "class-validator";
import { User } from "app/models/user.entity";
import { AuthorityProfile } from "app/models/authority-profile.entity";
import { ProfileType } from "app/enums/profile_type.enum";

export class CreateUserRequest{
    @ApiProperty()
    @IsString({message: 'El nombre de usuario debe ser una cadena de texto.'})
    @Transform(({ value }) => value.trim().toLowerCase())
    first_name: string

    @ApiProperty()
    @IsString({message: 'El apellido de usuario debe ser una cadena de texto.'})
    @Transform(({ value }) => value.trim().toLowerCase())
    last_name: string

    @ApiProperty()
    @IsNumberString()
    @Length(8, 8)
    @Transform(({ value }) => value.trim())
    phone: string

    @ApiProperty()
    @IsString({message: 'La contraseña debe ser una cadena de texto.'})
    @MinLength(6, {message: 'La contraseña debe tener al menos 6 caracteres'})
    @MaxLength(20, {message: 'La contraseña no debe exceder los 20 caracteres'})
    @Matches(/^\S+$/, {message: 'La contraseña no debe contener espacios',})
    password: string

    @ApiProperty()
    @IsNumber()
    roleId: number

    toUser(): User{
        const user = new User();
        user.first_name = this.first_name;
        user.last_name = this.last_name;
        user.phone = this.phone;
        user.password = this.password;
        return user
    }
}

export class CreateAuthorityUserRequest{
    @ApiProperty()
    @IsString({message: 'El nombre de usuario debe ser una cadena de texto.'})
    @Transform(({ value }) => value.trim().toLowerCase())
    first_name: string

    @ApiProperty()
    @IsString({message: 'El apellido de usuario debe ser una cadena de texto.'})
    @Transform(({ value }) => value.trim().toLowerCase())
    last_name: string

    @ApiProperty()
    @IsNumberString()
    @Length(8, 8)
    @Transform(({ value }) => value.trim())
    phone: string

    @ApiProperty()
    @IsString({message: 'La contraseña debe ser una cadena de texto.'})
    @MinLength(6, {message: 'La contraseña debe tener al menos 6 caracteres'})
    @MaxLength(20, {message: 'La contraseña no debe exceder los 20 caracteres'})
    @Matches(/^\S+$/, {message: 'La contraseña no debe contener espacios',})
    password: string

    @ApiProperty()
    @IsNumber()
    roleId: number

    @ApiProperty()
    @IsString()
    @Transform(({value}) => value.trim())
    ci: string

    @ApiProperty()
    @IsEmail({}, { message: 'Debe ingresar un correo electrónico válido.' })
    @Transform(({ value }) => value.trim().toLowerCase())
    gmail: string;

    @ApiProperty({
        enum: ProfileType
    })
    @IsEnum(ProfileType)
    profile_type: ProfileType;

    toUser(): User{
        const user = new User();
        user.first_name = this.first_name;
        user.last_name = this.last_name;
        user.phone = this.phone;
        user.password = this.password;
        return user
    }

    toAuthorityProfile(): AuthorityProfile {
        const profile = new AuthorityProfile();

        profile.ci = this.ci;
        profile.gmail = this.gmail;
        profile.profile_type = this.profile_type;

        return profile;
    }
}

export class UpdateUserRequest{
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    @Transform(({ value }) => value?.trim().toLowerCase())
    first_name?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    @Transform(({ value }) => value?.trim().toLowerCase())
    last_name?: string;
}

export class UpdateLocationRequest {
    @ApiProperty()
    @IsNumber()
    latitude: number;

    @ApiProperty()
    @IsNumber()
    longitude: number;
}

export class UpdatePasswordRequest {
    @ApiProperty()
    @IsString()
    current_password: string;

    @ApiProperty()
    @IsString()
    @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
    @MaxLength(20, { message: 'La contraseña no debe exceder los 20 caracteres' })
    @Matches(/^\S+$/, { message: 'La contraseña no debe contener espacios' })
    new_password: string;
}