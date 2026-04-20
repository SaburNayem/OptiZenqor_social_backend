import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { PlatformDataService } from '../data/platform-data.service';
import { CreateEventDto, EventActorDto } from '../dto/api.dto';

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private readonly platformData: PlatformDataService) {}

  @Get()
  @ApiQuery({ name: 'status', required: false, enum: ['Featured', 'Approved', 'Review'] })
  getEvents(@Query('status') status?: 'Featured' | 'Approved' | 'Review') {
    return this.platformData.getEvents(status);
  }

  @Get(':id')
  getEvent(@Param('id') id: string) {
    return this.platformData.getEvent(id);
  }

  @Post()
  createEvent(@Body() body: CreateEventDto) {
    return this.platformData.createEvent({
      title: body.title,
      organizer: body.organizer,
      date: body.date,
      time: body.time,
      location: body.location,
      participants: body.participants ?? 0,
      price: body.price ?? 0,
      status: body.status,
    });
  }

  @Patch(':id/rsvp')
  toggleEventRsvp(@Param('id') id: string, @Body() body: EventActorDto) {
    return this.platformData.toggleEventRsvp(id, body.userId);
  }

  @Patch(':id/save')
  toggleEventSave(@Param('id') id: string, @Body() body: EventActorDto) {
    return this.platformData.toggleEventSave(id, body.userId);
  }
}
