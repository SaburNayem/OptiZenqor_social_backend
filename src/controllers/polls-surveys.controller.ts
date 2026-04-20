import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AppExtensionsDataService } from '../data/app-extensions-data.service';
import { VotePollDto } from '../dto/api.dto';

@ApiTags('polls-surveys')
@Controller('polls-surveys')
export class PollsSurveysController {
  constructor(private readonly appExtensionsData: AppExtensionsDataService) {}

  @Get()
  getPollsAndSurveys() {
    return this.appExtensionsData.getPollsAndSurveys();
  }

  @Get('active')
  getActiveEntries() {
    return this.appExtensionsData.getPollsAndSurveys().activeEntries;
  }

  @Get('drafts')
  getDraftEntries() {
    return this.appExtensionsData.getPollsAndSurveys().draftEntries;
  }

  @Patch(':id/vote')
  vote(@Param('id') id: string, @Body() body: VotePollDto) {
    return this.appExtensionsData.votePoll(id, body.optionIndex);
  }
}
