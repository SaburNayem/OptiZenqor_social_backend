import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ExperienceDatabaseService } from '../services/experience-database.service';
import { successResponse } from '../utils/api-response.util';

@ApiTags('learning-courses')
@Controller('learning-courses')
export class LearningCoursesController {
  constructor(private readonly experienceDatabase: ExperienceDatabaseService) {}

  @Get()
  async getCourses() {
    const payload = await this.experienceDatabase.getLearningCourses();
    return {
      ...successResponse('Learning courses fetched successfully.', payload),
      courses: payload.courses,
      items: payload.items,
      results: payload.results,
    };
  }
}
