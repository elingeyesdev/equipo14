import { Controller, Delete, Param, Post, UploadedFile } from "@nestjs/common";
import { ImagesService } from "../../services/images.service";
import { ApiBearerAuth } from "@nestjs/swagger";

@ApiBearerAuth()
@Controller('images')
export class ImagesController {
    constructor(private readonly imagesService: ImagesService) {}

    @Delete(':id')
    remove(@Param('id') id: number){
        return this.imagesService.remove(id)
    }
}