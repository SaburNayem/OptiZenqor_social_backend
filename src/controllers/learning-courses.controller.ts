import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AppExtensionsDataService } from '../data/app-extensions-data.service';

@ApiTags('learning-courses')
@Controller('learning-courses')
export class LearningCoursesController {
  constructor(private readonly appExtensionsData: AppExtensionsDataService) {}

  @Get()
  getCourses() {
    return this.appExtensionsData.getLearningCourses();
  }
}
