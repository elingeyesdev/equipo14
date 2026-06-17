import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNumberString, IsOptional, IsString } from 'class-validator';

export class FilterReportsQuery {
    @ApiPropertyOptional({ description: 'ID del tipo de reporte' })
    @IsOptional()
    @IsNumberString()
    typeId?: string;

    @ApiPropertyOptional({
        description: 'Categoría agrupada: accidentes | robos | incendios | emergencias',
    })
    @IsOptional()
    @IsIn(['accidentes', 'robos', 'incendios', 'emergencias'])
    category?: string;

    @ApiPropertyOptional({ description: 'verified | pending' })
    @IsOptional()
    @IsIn(['verified', 'pending'])
    status?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    zone?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ description: 'ISO date YYYY-MM-DD' })
    @IsOptional()
    @IsString()
    from?: string;

    @ApiPropertyOptional({ description: 'ISO date YYYY-MM-DD' })
    @IsOptional()
    @IsString()
    to?: string;

    /** Solo admin/autoridad: incluye reportes archivados (soft-deleted por expiración) */
    @ApiPropertyOptional({ description: 'true para incluir reportes archivados' })
    @IsOptional()
    @IsIn(['true', 'false'])
    includeDeleted?: string;
}

export const REPORT_CATEGORY_TYPE_IDS: Record<string, number[]> = {
    accidentes: [3, 7],
    robos: [1, 4],
    incendios: [2, 5],
    emergencias: [6],
};
