import { ConfigService } from '@nestjs/config';
import { ConfigOptions } from 'cloudinary';

export const cloudinaryConfig = (
  configService: ConfigService
): ConfigOptions => ({
  cloud_name: configService.get<string>('CLOUDINARY_API_CLOUD_NAME'),
  api_key: configService.get<string>('CLOUDINARY_API_KEY'),
  api_secret: configService.get<string>('CLOUDINARY_API_SECRET'),
  secure: true,
});
