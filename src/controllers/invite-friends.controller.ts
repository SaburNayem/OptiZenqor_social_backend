import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EcosystemDataService } from '../data/ecosystem-data.service';

@ApiTags('invite-friends')
@Controller('invite-friends')
export class InviteFriendsController {
  constructor(private readonly ecosystemData: EcosystemDataService) {}

  @Get()
  getInviteFriends() {
    return this.ecosystemData.getReferral();
  }
}
