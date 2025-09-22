import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiOptions } from 'cloudinary';
import envConfig from '../config/env.config';

@Injectable()
export class CloudinaryProvider {
  constructor() {
    const { cloudinaryCloudName, cloudinaryApiKey, cloudinaryApiSecret } =
      envConfig;
    cloudinary.config({
      cloud_name: cloudinaryCloudName,
      api_key: cloudinaryApiKey,
      api_secret: cloudinaryApiSecret,
    });
  }

  private getPublicIds(filePaths: string[]): string[] {
    const publicIds = filePaths.map((url) => {
      const parts = url.split('/');
      const fileWithExtension = parts[parts.length - 1];
      const publicId = fileWithExtension.split('.')[0];
      return publicId;
    });

    return publicIds;
  }

  async uploadDocumentToCloud(filePath: string) {
    try {
      const options: UploadApiOptions = {
        resource_type: 'raw',
        use_filename: true,
        unique_filename: false,
        overwrite: true,
        invalidate: true,
      };
      return await cloudinary.uploader.upload(filePath, options);
    } catch (error) {
      console.error('Error uploading document:', error);
      throw new Error('Failed to upload document');
    }
  }

  async deletePdfsFromCloud(filePaths: string[]) {
    try {
      const publicIds = this.getPublicIds(filePaths);
      const options: UploadApiOptions = {
        invalidate: true,
        resource_type: 'raw',
      };
      return await cloudinary.api.delete_resources(publicIds, options);
    } catch (error) {
      console.error('Error deleting Pdfs:', error);
      throw new Error('Failed to delete Pdfs');
    }
  }
}
