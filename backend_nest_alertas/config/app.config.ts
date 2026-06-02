import { registerAs } from "@nestjs/config";

export default registerAs('app', () => ({
    port: process.env.PORT ?? '3000',
    apiPrefix: '/api',
    corsOrigins: process.env.CORS_ORIGINS
        ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
        : [],
}));