import { Controller, Delete, Param } from "@nestjs/common";
import { ImagesService } from "../../services/images.service";
import { ApiBearerAuth } from "@nestjs/swagger";
import { Roles } from "app/decorators/roles.decorator";

@ApiBearerAuth()
@Controller('images')
export class ImagesController {
    constructor(private readonly imagesService: ImagesService) {}

    @Delete(':id')
    @Roles('admin', 'autoridad')
    remove(@Param('id') id: number){
        return this.imagesService.remove(id)
    }
}