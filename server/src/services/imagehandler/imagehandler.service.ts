import { Injectable } from '@nestjs/common';
import { v2 } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

import { cloudinaryConfig } from 'src/common/config/cloudinary';

const configService = new ConfigService();

@Injectable()
export class ImagehandlerService {
  private config = v2.config(cloudinaryConfig(configService));

  constructor() {
    v2.config(this.config);
  }

  async uploadImage(imageUrl: string) {
    try {
      const response = await v2.uploader.upload(imageUrl, {
        resource_type: 'auto',
      });

      return {
        publicId: response?.public_id,
        url: response?.secure_url,
      };
    } catch (error) {
      throw error;
    }
  }

  async deleteImage(id: string) {
    try {
      await v2.uploader.destroy(id);
      return {
        message: 'Image deleted',
        imageId: id,
        error: false,
      };
    } catch (error) {
      console.log("image deleted error", error)
      throw error;
    }
  }
}
