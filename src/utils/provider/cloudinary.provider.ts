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

  getPublicIds(filePaths: string[]) {
    return filePaths
      .map((url) => {
        const matches = url.match(/upload\/(?:v\d+\/)?(.+\.[a-z0-9]+)$/i);
        return matches ? matches[1] : null;
      })
      .filter(Boolean);
  }

  async uploadDocumentToCloud(filePath: string, folderName?: string) {
    try {
      const options: UploadApiOptions = {
        resource_type: 'raw',
        folder: `archive/${folderName || 'general'}`,
        use_filename: true,
        unique_filename: false,
        overwrite: true,
        invalidate: true,
        format: null,
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
      if (publicIds.length === 0) {
        console.warn('No valid Cloudinary public IDs found for deletion.');
        return;
      }
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
