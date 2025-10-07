import { Cron, CronExpression } from '@nestjs/schedule';

export class UserCron {
  constructor() {}
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async deleteUser30daysAfterProjectCompleted() {
    //TODO: come back for this todo

  }
}
