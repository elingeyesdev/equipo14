import { Image } from "app/models/image.entity";

export class ImageResponse {
    id: number;
    url: string;
    uploaded_at: Date;
    uploadedBy: {
        id: string;
        first_name: string;
        last_name: string;
    };

    static FromImagetoResponse(image: Image): ImageResponse {
        const response = new ImageResponse();

        response.id = image.id;
        response.url = image.url;
        response.uploaded_at = image.uploaded_at;

        response.uploadedBy =
        {
            id: image.uploadedBy.id,
            first_name: image.uploadedBy.first_name,
            last_name: image.uploadedBy.last_name,
        }
        return response;
    }

    static FromImageListToResponse(images: Image[]): ImageResponse[] {
        return images.map(image => this.FromImagetoResponse(image));
    }
}