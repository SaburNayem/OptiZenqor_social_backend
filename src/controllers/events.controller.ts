import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PlatformDataService } from '../data/platform-data.service';

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private readonly platformData: PlatformDataService) {}

  @Get()
  getEvents() {
    return this.platformData.getEvents();
  }

  @Post()
  createEvent(
    @Body()
    body: {
      title: string;
      organizer: string;
      date: string;
      time: string;
      location: string;
      participants?: number;
      price?: number;
      status?: 'Featured' | 'Approved' | 'Review';
    },
  ) {
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
}
