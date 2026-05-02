import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { RegisterPushDeviceDto } from '../dto/admin.dto';
import {
  NotificationDevicesQueryDto,
  UpdateNotificationDeviceDto,
} from '../dto/api.dto';
import { AdminDatabaseService } from '../services/admin-database.service';
import { CoreDatabaseService } from '../services/core-database.service';
import { successResponse } from '../utils/api-response.util';

@ApiTags('notification-devices')
@Controller('notification-devices')
export class NotificationDevicesController {
  constructor(
    private readonly coreDatabase: CoreDatabaseService,
    private readonly adminDatabase: AdminDatabaseService,
  ) {}

  @UseGuards(SessionAuthGuard)
  @Post()
  @ApiBody({ type: RegisterPushDeviceDto })
  async register(
    @Body() body: RegisterPushDeviceDto,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Push device registered successfully.',
      await this.adminDatabase.registerPushDevice(user.id, body),
    );
  }

  @UseGuards(SessionAuthGuard)
  @Get()
  async list(
    @Query() query: NotificationDevicesQueryDto,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Push devices fetched successfully.',
      await this.adminDatabase.listUserPushDevices(user.id, query),
    );
  }

  @UseGuards(SessionAuthGuard)
  @Get(':id')
  async detail(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Push device fetched successfully.',
      await this.adminDatabase.getUserPushDevice(user.id, id),
    );
  }

  @UseGuards(SessionAuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: UpdateNotificationDeviceDto,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Push device updated successfully.',
      await this.adminDatabase.updateUserPushDevice(user.id, id, body),
    );
  }

  @UseGuards(SessionAuthGuard)
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Push device deleted successfully.',
      await this.adminDatabase.deleteUserPushDevice(user.id, id),
    );
  }
}
