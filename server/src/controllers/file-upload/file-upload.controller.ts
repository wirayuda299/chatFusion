import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express/multer';
import { memoryStorage } from 'multer';
import { ImagehandlerService } from 'src/services/imagehandler/imagehandler.service';

const storage = memoryStorage();

@Controller('/api/v1/file')
export class FileUploadController {
  constructor(private imageService: ImagehandlerService) {}
  @Post('/upload-image')
  @UseInterceptors(
    FileInterceptor('file', {
      dest: './uploads',
      storage,
      limits: {
        fileSize: 10000000,
      },
    })
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    const b64 = Buffer.from(file.buffer).toString('base64');
    const dataURI = 'data:' + file.mimetype + ';base64,' + b64;
    const data = await this.imageService.uploadImage(dataURI);
    return {
      publicId: data?.publicId,
      url: data?.url,
    };
  }

  @Post('/delete-image')
  async deleteImage(@Body('id') id: string) {
    return this.imageService.deleteImage(id);
  }
}
