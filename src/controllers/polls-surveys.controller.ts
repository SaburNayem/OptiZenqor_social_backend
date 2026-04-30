import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { VotePollDto } from '../dto/api.dto';
import { ExperienceDatabaseService } from '../services/experience-database.service';
import { successResponse } from '../utils/api-response.util';

@ApiTags('polls-surveys')
@Controller('polls-surveys')
export class PollsSurveysController {
  constructor(private readonly experienceDatabase: ExperienceDatabaseService) {}

  @Get()
  async getPollsAndSurveys() {
    const payload = await this.experienceDatabase.getPollsAndSurveys();
    return {
      ...successResponse('Polls and surveys fetched successfully.', payload),
      activeEntries: payload.activeEntries,
      draftEntries: payload.draftEntries,
      quickTemplates: payload.quickTemplates,
      items: payload.items,
      results: payload.results,
    };
  }

  @Get('active')
  async getActiveEntries() {
    const payload = await this.experienceDatabase.getPollsAndSurveys('active');
    return successResponse('Active polls and surveys fetched successfully.', {
      items: payload.activeEntries,
      results: payload.activeEntries,
      activeEntries: payload.activeEntries,
    });
  }

  @Get('drafts')
  async getDraftEntries() {
    const payload = await this.experienceDatabase.getPollsAndSurveys('draft');
    return successResponse('Draft polls and surveys fetched successfully.', {
      items: payload.draftEntries,
      results: payload.draftEntries,
      draftEntries: payload.draftEntries,
    });
  }

  @Patch(':id/vote')
  async vote(@Param('id') id: string, @Body() body: VotePollDto) {
    const item = await this.experienceDatabase.votePollSurvey(id, body.optionIndex);
    return successResponse('Poll vote recorded successfully.', {
      item,
      poll: item,
      data: item,
    });
  }
}
