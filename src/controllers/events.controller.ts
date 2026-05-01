import { Body, Controller, Get, Headers, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { CreateEventDto, EventActorDto, EventsQueryDto } from '../dto/api.dto';
import { CoreDatabaseService } from '../services/core-database.service';
import { ExperienceDatabaseService } from '../services/experience-database.service';
import { successResponse } from '../utils/api-response.util';

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(
    private readonly experienceDatabase: ExperienceDatabaseService,
    private readonly coreDatabase: CoreDatabaseService,
  ) {}

  @Get()
  @ApiQuery({ name: 'status', required: false, enum: ['Featured', 'Approved', 'Review'] })
  async getEvents(@Query() query: EventsQueryDto) {
    const payload = await this.experienceDatabase.getEvents(query);
    return {
      ...successResponse('Events fetched successfully.', payload, payload.pagination),
      items: payload.items,
      results: payload.results,
      events: payload.events,
    };
  }

  @Get('create')
  getEventCreateOptions() {
    return successResponse('Event creation options fetched successfully.', {
      categories: ['conference', 'meetup', 'workshop', 'community'],
      defaultStatuses: ['Review', 'Approved', 'Featured'],
      recommendedLocations: ['Dhaka', 'Remote', 'Online'],
    });
  }

  @Get('pool/create')
  getEventPoolCreateOptions() {
    return successResponse('Event pool creation options fetched successfully.', {
      categories: ['conference', 'meetup', 'workshop', 'community'],
      pollTemplates: [],
      activePolls: [],
      draftPolls: [],
    });
  }

  @Get('detail')
  async getEventDetail(@Query('id') id: string) {
    return successResponse('Event fetched successfully.', await this.experienceDatabase.getEvent(id));
  }

  @Get(':id')
  async getEvent(@Param('id') id: string) {
    return successResponse('Event fetched successfully.', await this.experienceDatabase.getEvent(id));
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
    return successResponse(
      'Event created successfully.',
      await this.experienceDatabase.createEvent(organizer.id, body),
    );
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
    return successResponse(
      'Event RSVP updated successfully.',
      await this.experienceDatabase.toggleEventRsvp(id, user.id),
    );
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
    return successResponse(
      'Event save state updated successfully.',
      await this.experienceDatabase.toggleEventSave(id, user.id),
    );
  }
}
