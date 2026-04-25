import { registerAs } from "@nestjs/config";

export default registerAs('jwt', () => ({
    secret: process.env.JWT_SECRET,
    accessExpiresIn: process.env.ACCESS_TOKEN_VALIDITY_DURATION_IN_HOURS,
    refreshExpiresIn: process.env.REFRESH_TOKEN_VALIDITY_DURATION_IN_HOURS,
}));