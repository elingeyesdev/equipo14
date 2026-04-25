import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ReportType } from "app/models/report-types.entity";
import { log } from "console";
import { Repository } from 'typeorm';

@Injectable()
export class ReportTypesService{
    constructor(
        @InjectRepository(ReportType)
        private reportTypeRepository: Repository<ReportType>
    ){}

    async create(name: string) {
        const newReportType = this.reportTypeRepository.create({
            name: name
        });

        const saveRportType = await this.reportTypeRepository.save(newReportType);

        return saveRportType;
    }

    async findAll(){
        const reportTypes = await this.reportTypeRepository.find();
        return reportTypes
    }

    async remove(id: number){
        const result = await this.reportTypeRepository.delete(id);

        if(result.affected === 0){
            throw new NotFoundException(`El tipo con ID ${id} no se encontro`)
        }
        return { message: "Tipo eliminado correctamente" };
    }
}