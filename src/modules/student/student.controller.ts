import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('student')
@Controller('student')
export class StudentController {
  // Add student endpoints here
}
