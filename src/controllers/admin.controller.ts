import { Controller, Get } from '@nestjs/common';
import { PlatformDataService } from '../data/platform-data.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly platformData: PlatformDataService) {}

  @Get('dashboard')
  getDashboard() {
    return this.platformData.getDashboardSummary();
  }

  @Get('users')
  getAdminUsers() {
    return this.platformData.getUsers();
  }

  @Get('content')
  getContent() {
    return {
      posts: this.platformData.getPosts(),
      stories: this.platformData.getStories(),
      reels: this.platformData.getReels(),
    };
  }

  @Get('reports')
  getReports() {
    return this.platformData.getReports();
  }

  @Get('chat-cases')
  getChatCases() {
    return this.platformData.getThreads();
  }

  @Get('events')
  getEvents() {
    return this.platformData.getEvents();
  }

  @Get('monetization')
  getMonetization() {
    return {
      wallet: this.platformData.getWalletTransactions(),
      subscriptions: this.platformData.getSubscriptions(),
      plans: this.platformData.getPlans(),
    };
  }

  @Get('notifications')
  getNotifications() {
    return this.platformData.getCampaigns();
  }

  @Get('analytics')
  getAnalytics() {
    return {
      userAnalytics: [
        { label: 'New signups', value: '8.2K' },
        { label: 'DAU/MAU', value: '36.7%' },
        { label: 'Premium conversion', value: '4.9%' },
      ],
      contentAnalytics: [
        { label: 'Posts today', value: '18.2K' },
        { label: 'Reel completion', value: '61%' },
        { label: 'Story replies', value: '12.4K' },
      ],
      moderationAnalytics: [
        { label: 'Reports/day', value: '241' },
        { label: 'Avg resolution time', value: '19m' },
        { label: 'False report rate', value: '7%' },
      ],
    };
  }

  @Get('roles')
  getRoles() {
    return this.platformData.getRolesMatrix();
  }

  @Get('settings')
  getSettings() {
    return this.platformData.getSettings();
  }

  @Get('audit-logs')
  getAuditLogs() {
    return this.platformData.getAuditLogs();
  }
}
