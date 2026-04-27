import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReportType } from 'app/models/report-types.entity';
import { Role } from 'app/models/role.entity';
import { Repository } from 'typeorm';

/**
 * Inserta los tipos de reporte por defecto si la tabla está vacía.
 * Se llama una vez al arrancar la app (bootstrap/app.ts).
 */
export async function seedReportTypes(app: INestApplication): Promise<void> {
    const repo = app.get<Repository<ReportType>>(getRepositoryToken(ReportType));

    const count = await repo.count();
    if (count > 0) return; // Ya hay datos, no sobrescribir

    await repo.save([
        { id: 1, name: 'robo' },
        { id: 2, name: 'incendio' },
        { id: 3, name: 'accidente' },
    ]);

    console.log('[Seed] Tipos de reporte insertados: robo (1), incendio (2), accidente (3)');
}

export async function seedRoles(app: INestApplication): Promise<void> {
    const repo = app.get<Repository<Role>>(getRepositoryToken(Role));

    const count = await repo.count();
    if (count > 0) return;

    await repo.save([
        { id: 1, name: 'usuario normal' },
        { id: 2, name: 'autoridad' },
    ]);

    console.log('[Seed] Roles insertados: usuario normal (1), autoridad (2)');
}
