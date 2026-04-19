import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AdminOpsDataService {
  private adminSessions = [
    {
      id: 'adm-s1',
      adminId: 'a1',
      name: 'Super Admin',
      email: 'admin@optizenqor.app',
      role: 'Super Admin',
      mfaEnabled: true,
      device: 'Windows Chrome',
      ipAddress: '103.12.44.19',
      lastActive: '2026-04-19T15:40:00.000Z',
      current: true,
    },
    {
      id: 'adm-s2',
      adminId: 'a2',
      name: 'Moderator 02',
      email: 'moderator@optizenqor.app',
      role: 'Content Moderator',
      mfaEnabled: true,
      device: 'Mac Safari',
      ipAddress: '103.12.44.33',
      lastActive: '2026-04-19T13:10:00.000Z',
      current: false,
    },
  ];

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
  }> = [
    {
      id: 'ver-1',
      userId: 'u3',
      name: 'Rafi Ahmed',
      roleType: 'User',
      verificationState: 'Pending',
      documentType: 'National ID',
      submittedAt: '2026-04-18T09:20:00.000Z',
      notes: ['Name matches profile', 'Selfie review pending'],
      history: ['Submitted documents', 'Auto-check passed'],
      decision: null,
    },
    {
      id: 'ver-2',
      userId: 'u5',
      name: 'Arif Talent Hub',
      roleType: 'Recruiter',
      verificationState: 'Eligible',
      documentType: 'Business Registration',
      submittedAt: '2026-04-17T14:10:00.000Z',
      notes: ['Company proof incomplete'],
      history: ['Eligibility granted', 'Manual review opened'],
      decision: null,
    },
  ];

  private moderationCases = [
    {
      id: 'R-1021',
      title: 'Harassment in reel comments',
      type: 'content',
      targetType: 'comment_thread',
      severity: 'Critical',
      target: '@mayaquinn reel',
      reason: 'Repeated abusive replies and targeted insults in public thread.',
      evidence: '5 reports, 1 moderator auto-flag, 58 reply thread attached.',
      history: ['Warned one participant last week'],
      assignedTo: 'Moderator 02',
      status: 'open',
      enforcementActions: ['hide', 'warn', 'mute', 'block', 'reject', 'escalate'],
    },
    {
      id: 'R-1023',
      title: 'Marketplace refund abuse',
      type: 'commerce',
      targetType: 'order_flow',
      severity: 'High',
      target: 'Order flow 442',
      reason: 'Pattern of repeated refund requests after delivery confirmation.',
      evidence: '4 linked cases across the same device cluster.',
      history: ['Seller previously clean', 'Buyer cluster suspicious'],
      assignedTo: 'Finance Admin',
      status: 'investigating',
      enforcementActions: ['hold_payout', 'flag_buyer', 'request_documents', 'escalate'],
    },
  ];

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
  }> = [
    {
      id: 'CHAT-11',
      threadId: 't1',
      thread: 'Creator Collab Group',
      participants: ['Maya Quinn', 'Rafi Ahmed', 'Nexa Studio'],
      flag: 'Abuse report',
      summary: 'Two users escalated a creator collaboration dispute.',
      transcript: [
        'Maya: Please remove the clip before reposting it.',
        'Other user: I can use whatever I want.',
        'Maya: This needs moderation.',
      ],
      frozen: false,
      restrictedParticipants: [],
      evidenceSnapshots: ['snapshot-1.png', 'snapshot-2.txt'],
    },
  ];

  private broadcastCampaigns = [
    {
      id: 'camp-1',
      name: 'Weekend creator challenge',
      audience: 'Creators',
      segmentId: 'seg-1',
      schedule: '2026-04-20T09:00:00.000Z',
      status: 'draft',
      delivered: 0,
      openRate: '0%',
    },
    {
      id: 'camp-2',
      name: 'Security alert update',
      audience: 'All users',
      segmentId: 'seg-2',
      schedule: '2026-04-19T08:00:00.000Z',
      status: 'sent',
      delivered: 12100,
      openRate: '64%',
    },
  ];

  private audienceSegments = [
    {
      id: 'seg-1',
      name: 'Creators',
      rules: ['role = Creator', 'followers > 1000'],
      estimatedAudience: 8420,
    },
    {
      id: 'seg-2',
      name: 'All users',
      rules: ['status = Active'],
      estimatedAudience: 128400,
    },
  ];

  private analyticsPipeline = {
    kpis: {
      userGrowth: '8.2K',
      contentOutput: '18.2K',
      moderationLoad: '241/day',
      revenue: '$38.4K MRR',
      eventsRsvp: '4.1K',
    },
    snapshots: [
      { period: 'today', users: 47200, posts: 18200, reports: 241, revenue: 38400 },
      { period: 'yesterday', users: 45100, posts: 17140, reports: 263, revenue: 37110 },
    ],
    leaderboards: [
      ['Maya Quinn', 'Creator', 'Top reel reach', '230K'],
      ['Luna Crafts', 'Seller', 'Best shop conversion', '8.4%'],
      ['Creator Meetup Dhaka', 'Event', 'Highest RSVPs', '1.2K'],
    ],
    exportJobs: [
      { id: 'exp-1', type: 'analytics_csv', status: 'completed', createdAt: '2026-04-19T10:00:00.000Z' },
    ],
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

  private auditLogs = [
    ['9:18 PM', 'Super Admin', 'Approved payout', 'Maya Quinn', 'Success'],
    ['8:54 PM', 'Moderator 02', 'Muted comment thread', 'R-1021', 'Success'],
    ['8:37 PM', 'Finance Admin', 'Updated premium plan', 'Creator Pro', 'Success'],
    ['8:10 PM', 'Support Admin', 'Restored account', '@nexa.studio', 'Success'],
  ];

  private contentOperations = {
    posts: [
      { id: 'p1', status: 'Visible', reports: 1, actionState: 'reviewable' },
      { id: 'p2', status: 'Featured', reports: 0, actionState: 'featured' },
    ],
    reels: [
      { id: 'r1', status: 'Under review', reports: 3, actionState: 'moderating' },
      { id: 'r2', status: 'Visible', reports: 0, actionState: 'clear' },
    ],
    stories: [
      { id: 's1', status: 'Visible', reports: 0, actionState: 'clear' },
      { id: 's2', status: 'Muted reach', reports: 1, actionState: 'limited' },
    ],
    comments: [
      { id: 'c1', status: 'Flagged', reports: 5, actionState: 'hidden' },
      { id: 'c2', status: 'Visible', reports: 0, actionState: 'clear' },
    ],
  };

  private commerceRisk = {
    disputes: [
      {
        id: 'disp-1',
        orderId: '442',
        type: 'refund_abuse',
        status: 'review',
        note: 'Repeated refund requests after confirmed delivery.',
      },
    ],
    payoutReviews: [
      {
        id: 'pay-1',
        user: 'Maya Quinn',
        amount: 480,
        channel: 'Bank Transfer',
        status: 'pending',
        holdReason: 'Manual compliance review',
      },
    ],
  };

  private supportOperations = {
    tickets: [
      {
        id: 'sup-1',
        subject: 'Delayed marketplace payout',
        assignedTo: 'Support Admin',
        escalationNotes: ['Waiting for finance review'],
        status: 'pending',
      },
    ],
    actions: [
      { id: 'sa-1', action: 'Restored account', actor: 'Support Admin', target: '@nexa.studio' },
    ],
  };

  private readonly adminPasswords = new Map<string, string>([
    ['admin@optizenqor.app', 'admin123'],
    ['moderator@optizenqor.app', 'admin123'],
  ]);

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
      throw new UnauthorizedException(
        'Invalid admin credentials. Use one of the demo admin emails from /admin/auth/demo-accounts.',
      );
    }

    const expectedPassword = this.adminPasswords.get(email) ?? 'admin123';
    if (password !== expectedPassword) {
      throw new UnauthorizedException('Invalid admin password. Demo admin password is admin123.');
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
