import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AdminOpsDataService {
  private adminSessions: Array<{
    id: string;
    adminId: string;
    name: string;
    email: string;
    role: string;
    mfaEnabled: boolean;
    device: string;
    ipAddress: string;
    lastActive: string;
    current: boolean;
  }> = [];

  private verificationQueue: Array<{
    id: string;
    userId: string;
    name: string;
    roleType: string;
    verificationState: string;
    documentType: string;
    submittedAt: string;
    notes: string[];
    history: string[];
    decision: 'approved' | 'rejected' | null;
  }> = [];

  private moderationCases: Array<{
    id: string;
    title: string;
    type: string;
    targetType: string;
    severity: string;
    target: string;
    reason: string;
    evidence: string;
    history: string[];
    assignedTo: string;
    status: string;
    enforcementActions: string[];
  }> = [];

  private chatModerationCases: Array<{
    id: string;
    threadId: string;
    thread: string;
    participants: string[];
    flag: string;
    summary: string;
    transcript: string[];
    frozen: boolean;
    restrictedParticipants: string[];
    evidenceSnapshots: string[];
  }> = [];

  private broadcastCampaigns: Array<{
    id: string;
    name: string;
    audience: string;
    segmentId: string;
    schedule: string;
    status: string;
    delivered: number;
    openRate: string;
  }> = [];

  private audienceSegments: Array<Record<string, unknown>> = [];

  private analyticsPipeline = {
    kpis: {
      userGrowth: '0',
      contentOutput: '0',
      moderationLoad: '0',
      revenue: '$0',
      eventsRsvp: '0',
    },
    snapshots: [] as Array<Record<string, unknown>>,
    leaderboards: [] as Array<string[]>,
    exportJobs: [] as Array<Record<string, unknown>>,
  };

  private permissionMatrix = {
    roles: [
      'Super Admin',
      'Operations Admin',
      'Content Moderator',
      'Finance Admin',
      'Support Admin',
      'Analytics Viewer',
    ],
    moduleScopes: {
      dashboard: ['view'],
      users: ['view', 'verify', 'suspend'],
      content: ['view', 'hide', 'feature'],
      reports: ['view', 'assign', 'resolve', 'escalate'],
      monetization: ['view', 'hold', 'approve'],
      settings: ['view', 'edit'],
      audit: ['view', 'export'],
    },
    templates: [
      { role: 'Super Admin', scopes: ['*'] },
      { role: 'Content Moderator', scopes: ['content.view', 'reports.resolve', 'chat.restrict'] },
      { role: 'Finance Admin', scopes: ['monetization.view', 'monetization.approve', 'audit.view'] },
    ],
  };

  private operationalSettings = {
    safetyDefaults: 'Enabled',
    storageRetention: '90 days',
    notificationRateLimit: 'Medium',
    maintenanceBanner: 'Disabled',
    maintenanceMode: false,
    remoteConfigVersion: '2026.04.19',
    campaignThrottlePerMinute: 1200,
  };

  private auditLogs: string[][] = [];

  private contentOperations = {
    posts: [] as Array<Record<string, unknown>>,
    reels: [] as Array<Record<string, unknown>>,
    stories: [] as Array<Record<string, unknown>>,
    comments: [] as Array<Record<string, unknown>>,
  };

  private commerceRisk = {
    disputes: [] as Array<Record<string, unknown>>,
    payoutReviews: [] as Array<Record<string, unknown>>,
  };

  private supportOperations = {
    tickets: [] as Array<Record<string, unknown>>,
    actions: [] as Array<Record<string, unknown>>,
  };

  private readonly adminPasswords = new Map<string, string>();

  getAdminDemoAccounts() {
    return this.adminSessions.map((session) => ({
      adminId: session.adminId,
      name: session.name,
      email: session.email,
      role: session.role,
      password: this.adminPasswords.get(session.email) ?? 'admin123',
    }));
  }

  loginAdmin(email: string, password: string) {
    const session = this.adminSessions.find((item) => item.email === email);
    if (!session) {
      throw new UnauthorizedException('Invalid admin credentials.');
    }

    const expectedPassword = this.adminPasswords.get(email) ?? 'admin123';
    if (password !== expectedPassword) {
      throw new UnauthorizedException('Invalid admin password.');
    }

    return {
      success: true,
      message: 'Admin login successful.',
      data: {
        token: `admin-token-${session.adminId}`,
        refreshToken: `admin-refresh-${session.adminId}`,
        session,
      },
    };
  }

  getAdminSessions() {
    return this.adminSessions;
  }

  revokeAdminSession(id: string) {
    const session = this.adminSessions.find((item) => item.id === id);
    if (!session) throw new NotFoundException(`Admin session ${id} not found`);
    session.current = false;
    return { success: true, session };
  }

  getVerificationQueue() {
    return this.verificationQueue;
  }

  decideVerification(id: string, decision: 'approved' | 'rejected', note?: string) {
    const item = this.verificationQueue.find((entry) => entry.id === id);
    if (!item) throw new NotFoundException(`Verification ${id} not found`);
    item.decision = decision;
    item.notes.push(note ?? `Decision: ${decision}`);
    item.verificationState = decision === 'approved' ? 'Verified' : 'Rejected';
    return item;
  }

  getModerationCases() {
    return this.moderationCases;
  }

  updateModerationCase(id: string, action: string) {
    const item = this.moderationCases.find((entry) => entry.id === id);
    if (!item) throw new NotFoundException(`Moderation case ${id} not found`);
    item.history.push(`Action applied: ${action}`);
    item.status = action === 'escalate' ? 'escalated' : 'updated';
    return item;
  }

  getChatModerationCases() {
    return this.chatModerationCases;
  }

  updateChatModerationCase(id: string, patch: { freeze?: boolean; restrictParticipant?: string }) {
    const item = this.chatModerationCases.find((entry) => entry.id === id);
    if (!item) throw new NotFoundException(`Chat moderation case ${id} not found`);
    if (typeof patch.freeze === 'boolean') item.frozen = patch.freeze;
    if (patch.restrictParticipant) item.restrictedParticipants.push(patch.restrictParticipant);
    return item;
  }

  getCampaigns() {
    return this.broadcastCampaigns;
  }

  createCampaign(input: { name: string; audience: string; segmentId: string; schedule: string }) {
    const item = {
      id: `camp-${this.broadcastCampaigns.length + 1}`,
      name: input.name,
      audience: input.audience,
      segmentId: input.segmentId,
      schedule: input.schedule,
      status: 'scheduled',
      delivered: 0,
      openRate: '0%',
    };
    this.broadcastCampaigns.unshift(item);
    return item;
  }

  getAudienceSegments() {
    return this.audienceSegments;
  }

  getAnalyticsPipeline() {
    return this.analyticsPipeline;
  }

  getPermissionMatrix() {
    return this.permissionMatrix;
  }

  getOperationalSettings() {
    return this.operationalSettings;
  }

  updateOperationalSettings(patch: Record<string, unknown>) {
    Object.assign(this.operationalSettings, patch);
    return this.operationalSettings;
  }

  getAuditLogs() {
    return this.auditLogs;
  }

  getContentOperations() {
    return this.contentOperations;
  }

  getCommerceRisk() {
    return this.commerceRisk;
  }

  getSupportOperations() {
    return this.supportOperations;
  }
}
