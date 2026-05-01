import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminDatabaseService } from '../services/admin-database.service';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminDatabase: AdminDatabaseService) {}

  @Get('dashboard')
  getDashboard() {
    return this.adminDatabase.getDashboardSummary();
  }

  @Get('users')
  getAdminUsers() {
    return this.adminDatabase.getAdminUsers();
  }

  @Get('content')
  async getContent() {
    return this.adminDatabase.getAdminContent();
  }

  @Get('reports')
  getReports() {
    return this.adminDatabase.getReports();
  }

  @Get('chat-cases')
  getChatCases() {
    return this.adminDatabase.getChatCases();
  }

  @Get('events')
  getEvents() {
    return this.adminDatabase.getEvents();
  }

  @Get('monetization')
  getMonetization() {
    return this.adminDatabase.getMonetization();
  }

  @Get('notifications')
  getNotifications() {
    return this.adminDatabase.getNotifications();
  }

  @Get('analytics')
  getAnalytics() {
    return this.adminDatabase.getAnalytics();
  }

  @Get('roles')
  getRoles() {
    return this.adminDatabase.getRoles();
  }

  @Get('settings')
  getSettings() {
    return this.adminDatabase.getSettings();
  }

  @Get('audit-logs')
  getAuditLogs() {
    return this.adminDatabase.getAuditLogs();
  }
}
