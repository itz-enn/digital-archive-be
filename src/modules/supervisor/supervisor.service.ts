import { Injectable } from '@nestjs/common';

@Injectable()
export class SupervisorService {
  // DASHBOARD
  async getSupervisorAnalytics() {}

  async studentOverview() {}

  //MY STUDENTS
  async assignedStudentsBySupervisor() {}

  async viewAllFilesByStudent() {}

  // TOPIC APPROVAL
  async getSubmittedTopicsByStudent() {}

  async reviewTopics() {}

  // DUPLICATE CHECK
  async checkProjectDuplicate() {}
}
