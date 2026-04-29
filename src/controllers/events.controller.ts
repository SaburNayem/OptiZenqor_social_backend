import { Body, Controller, Get, Headers, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { CreateEventDto, EventActorDto } from '../dto/api.dto';
import { CoreDatabaseService } from '../services/core-database.service';
import { ExperienceDatabaseService } from '../services/experience-database.service';

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(
    private readonly experienceDatabase: ExperienceDatabaseService,
    private readonly coreDatabase: CoreDatabaseService,
  ) {}

  @Get()
  @ApiQuery({ name: 'status', required: false, enum: ['Featured', 'Approved', 'Review'] })
  getEvents(@Query('status') status?: 'Featured' | 'Approved' | 'Review') {
    return this.experienceDatabase.getEvents(status);
  }

  @Get('create')
  getEventCreateOptions() {
    return {
      categories: ['conference', 'meetup', 'workshop', 'community'],
      defaultStatuses: ['Review', 'Approved', 'Featured'],
      recommendedLocations: ['Dhaka', 'Remote', 'Online'],
    };
  }

  @Get('pool/create')
  getEventPoolCreateOptions() {
    return {
      categories: ['conference', 'meetup', 'workshop', 'community'],
      pollTemplates: [],
      activePolls: [],
      draftPolls: [],
    };
  }

  @Get('detail')
  getEventDetail(@Query('id') id: string) {
    return this.experienceDatabase.getEvent(id);
  }

  @Get(':id')
  getEvent(@Param('id') id: string) {
    return this.experienceDatabase.getEvent(id);
  }

  @Post('create')
  createEventAlias(@Body() body: CreateEventDto) {
    return this.createEvent(body);
  }

  @Post('pool/create')
  async createEventFromPool(@Body() body: CreateEventDto & { pollTemplate?: string }) {
    const event = await this.createEvent(body);
    return {
      ...event,
      pollTemplate: body.pollTemplate ?? null,
    };
  }

  @UseGuards(SessionAuthGuard)
  @Post()
  async createEvent(
    @Body() body: CreateEventDto,
    @Headers('authorization') authorization?: string,
  ) {
    const organizer = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return this.experienceDatabase.createEvent(organizer.id, body);
  }

  @UseGuards(SessionAuthGuard)
  @Patch(':id/rsvp')
  async toggleEventRsvp(
    @Param('id') id: string,
    @Body() body: EventActorDto,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(
      authorization,
      body.userId,
    );
    return this.experienceDatabase.toggleEventRsvp(id, user.id);
  }

  @UseGuards(SessionAuthGuard)
  @Patch(':id/save')
  async toggleEventSave(
    @Param('id') id: string,
    @Body() body: EventActorDto,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(
      authorization,
      body.userId,
    );
    return this.experienceDatabase.toggleEventSave(id, user.id);
  }
}
