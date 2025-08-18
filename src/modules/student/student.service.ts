import { Injectable } from '@nestjs/common';

@Injectable()
export class StudentService {
  // DASHBOARD
  async getUserInfo() {}

  async getRecentFeedback() {}

  // TOPIC SUBMISSION
  async getSubmittedTopics() {}

  async submitNewTopics() {}

  // FILE UPLOAD
  async previouslyUploadedFile() {}

  async uploadFile() {}

  async deleteFile() {}

  async downloadFile() {}
}
