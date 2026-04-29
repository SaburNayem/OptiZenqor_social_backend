import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { makeId } from '../common/id.util';
import {
  CommunitiesQueryDto,
  CreateEventDto,
  CreateJobDto,
  CreatePageDto,
  CreateProductDto,
  EventsQueryDto,
  JobsQueryDto,
  MarketplaceProductsQueryDto,
  PagesQueryDto,
} from '../dto/api.dto';
import { CoreDatabaseService } from './core-database.service';
import { PrismaService } from './prisma.service';

@Injectable()
export class ExperienceDatabaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly coreDatabase: CoreDatabaseService,
  ) {}

  async getBootstrap(userId?: string) {
    const [feed, stories, reels, notifications, communities, products, jobs, events] =
      await Promise.all([
        this.coreDatabase.getFeed(),
        this.prisma.story.count({ where: { deletedAt: null, expiresAt: { gt: new Date() } } }),
        this.prisma.reel.count({ where: { deletedAt: null } }),
        userId
          ? this.prisma.appNotification.count({
              where: { recipientId: userId, read: false },
            })
          : Promise.resolve(0),
        this.prisma.community.count({ where: { deletedAt: null } }),
        this.prisma.marketplaceProduct.count({ where: { deletedAt: null } }),
        this.prisma.job.count({ where: { deletedAt: null } }),
        this.prisma.event.count({ where: { deletedAt: null } }),
      ]);

    const user = userId ? await this.coreDatabase.getUser(userId).catch(() => null) : null;

    return {
      generatedAt: new Date().toISOString(),
      authenticated: Boolean(user),
      user,
      counters: {
        feedItems: feed.length,
        activeStories: stories,
        reels,
        unreadNotifications: notifications,
        communities,
        marketplaceProducts: products,
        jobs,
        events,
      },
      entrypoints: {
        login: '/auth/login',
        me: '/auth/me',
        feed: '/feed',
        stories: '/stories',
        reels: '/reels',
        chatThreads: '/chat/threads',
        notifications: '/notifications',
        profile: user ? `/profile/${user.id}` : '/profile/:id',
        settingsState: '/settings/state',
        marketplaceProducts: '/marketplace/products',
        jobs: '/jobs',
        events: '/events',
      },
      feedPreview: feed.slice(0, 5),
    };
  }

  async getMarketplaceOverview(query: MarketplaceProductsQueryDto = {}) {
    const paging = this.normalizePaging(query.page, query.limit);
    const where: Prisma.MarketplaceProductWhereInput = {
      deletedAt: null,
      category: query.category?.trim() || undefined,
      sellerId: query.sellerId?.trim() || undefined,
      status: query.status?.trim() || undefined,
      OR: query.search?.trim()
        ? [
            { title: { contains: query.search.trim(), mode: 'insensitive' } },
            { description: { contains: query.search.trim(), mode: 'insensitive' } },
            { category: { contains: query.search.trim(), mode: 'insensitive' } },
            { location: { contains: query.search.trim(), mode: 'insensitive' } },
          ]
        : undefined,
    };
    const orderBy = this.resolveMarketplaceOrder(query.sort, query.order);
    const [products, totalProducts, orders] = await Promise.all([
      this.prisma.marketplaceProduct.findMany({
        where,
        orderBy,
        skip: paging.skip,
        take: paging.limit,
      }),
      this.prisma.marketplaceProduct.count({
        where,
      }),
      this.prisma.marketplaceOrder.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    const mappedProducts = await Promise.all(products.map((row) => this.mapMarketplaceProduct(row)));
    const sellers = await this.buildSellerProfiles(
      [...new Set(products.map((item) => item.sellerId))],
      products,
    );

    return {
      totalProducts,
      products: mappedProducts,
      items: mappedProducts,
      results: mappedProducts,
      categories: [...new Set(products.map((item) => item.category))],
      sellers,
      orders: orders.map((row) => this.mapMarketplaceOrder(row)),
      featuredProducts: mappedProducts.slice(0, 5),
      trendingProducts: mappedProducts
        .slice()
        .sort((left, right) => right.watchers - left.watchers)
        .slice(0, 5),
      recommendedProducts: mappedProducts
        .slice()
        .sort((left, right) => right.views - left.views)
        .slice(0, 8),
      pagination: this.buildPagination(totalProducts, paging.page, paging.limit),
      filters: {
        category: query.category?.trim() || null,
        status: query.status?.trim() || null,
        sellerId: query.sellerId?.trim() || null,
        search: query.search?.trim() || null,
        sort: query.sort?.trim() || 'createdAt',
        order: query.order ?? 'desc',
      },
    };
  }

  async getMarketplaceCreateOptions() {
    const products = await this.prisma.marketplaceProduct.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    return {
      categories: [...new Set(products.map((item) => item.category))],
      conditions: [...new Set(products.map((item) => item.condition).filter(Boolean))],
      sellerProfiles: await this.buildSellerProfiles(
        [...new Set(products.map((item) => item.sellerId))],
        products,
      ),
      deliveryMethods: ['Pickup', 'Shipping', 'Local delivery'],
      paymentMethods: ['Cash on delivery', 'Wallet', 'Card'],
      moderationNotes: [
        'Avoid prohibited items and misleading titles.',
        'Use clear photos and accurate condition details.',
      ],
    };
  }

  async getMarketplaceProduct(id: string) {
    const product = await this.prisma.marketplaceProduct.findFirst({
      where: { id, deletedAt: null },
    });
    if (!product) {
      throw new NotFoundException(`Marketplace product ${id} not found`);
    }
    return this.mapMarketplaceProduct(product);
  }

  async getMarketplaceDetail(id: string) {
    const product = await this.prisma.marketplaceProduct.findFirst({
      where: { id, deletedAt: null },
    });
    if (!product) {
      throw new NotFoundException(`Marketplace product ${id} not found`);
    }

    const [related, seller, orders] = await Promise.all([
      this.prisma.marketplaceProduct.findMany({
        where: {
          deletedAt: null,
          category: product.category,
          id: { not: id },
        },
        orderBy: { createdAt: 'desc' },
        take: 6,
      }),
      this.buildSellerProfile(product.sellerId, [product]),
      this.prisma.marketplaceOrder.findMany({
        where: { productId: id },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      product: await this.mapMarketplaceProduct(product),
      seller,
      relatedProducts: await Promise.all(related.map((row) => this.mapMarketplaceProduct(row))),
      saved: false,
      sellerFollowed: false,
      chatMessages: [],
      offerHistory: [],
      orderHistory: orders.map((row) => this.mapMarketplaceOrder(row)),
    };
  }

  async createMarketplaceProduct(body: CreateProductDto) {
    await this.coreDatabase.getUser(body.sellerId);
    const product = await this.prisma.marketplaceProduct.create({
      data: {
        id: makeId('product'),
        sellerId: body.sellerId,
        title: body.title,
        description: body.description,
        price: new Prisma.Decimal(body.price),
        category: body.category,
        subcategory: body.subcategory,
        condition: body.condition,
        location: body.location,
        images: (body.images ?? []) as Prisma.InputJsonValue,
        status: 'active',
      },
    });
    return this.mapMarketplaceProduct(product);
  }

  async createMarketplaceOrder(
    buyerId: string,
    input: { productId: string; address: string; deliveryMethod: string; paymentMethod: string },
  ) {
    const product = await this.prisma.marketplaceProduct.findFirst({
      where: { id: input.productId, deletedAt: null },
    });
    if (!product) {
      throw new NotFoundException(`Marketplace product ${input.productId} not found`);
    }

    const order = await this.prisma.marketplaceOrder.create({
      data: {
        id: makeId('order'),
        productId: product.id,
        buyerId,
        sellerId: product.sellerId,
        amount: product.price,
        address: input.address,
        deliveryMethod: input.deliveryMethod,
        paymentMethod: input.paymentMethod,
        status: 'pending',
      },
    });
    return this.mapMarketplaceOrder(order);
  }

  async getJobs(query: JobsQueryDto = {}) {
    const paging = this.normalizePaging(query.page, query.limit);
    const where: Prisma.JobWhereInput = {
      deletedAt: null,
      status: query.status?.trim() || undefined,
      type: query.type?.trim() || undefined,
      recruiterId: query.userId?.trim() || undefined,
      OR: query.search?.trim()
        ? [
            { title: { contains: query.search.trim(), mode: 'insensitive' } },
            { company: { contains: query.search.trim(), mode: 'insensitive' } },
            { description: { contains: query.search.trim(), mode: 'insensitive' } },
            { location: { contains: query.search.trim(), mode: 'insensitive' } },
          ]
        : undefined,
    };
    const orderBy = this.resolveJobOrder(query.sort, query.order);
    const [jobs, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        orderBy,
        skip: paging.skip,
        take: paging.limit,
      }),
      this.prisma.job.count({ where }),
    ]);
    const items = jobs.map((row) => this.mapJob(row));
    return {
      jobs: items,
      items,
      results: items,
      pagination: this.buildPagination(total, paging.page, paging.limit),
      filters: {
        status: query.status?.trim() || null,
        type: query.type?.trim() || null,
        userId: query.userId?.trim() || null,
        search: query.search?.trim() || null,
        sort: query.sort?.trim() || 'createdAt',
        order: query.order ?? 'desc',
      },
    };
  }

  async getJobsNetworkingOverview(userId?: string) {
    const [jobsPayload, companies] = await Promise.all([
      this.getJobs(),
      this.getJobCompanies(),
    ]);

    const jobs = jobsPayload.jobs;
    const payload: Record<string, unknown> = {
      totalJobs: jobs.length,
      openJobs: jobs.filter((job) => job.status === 'open').length,
      jobs,
      companies,
    };

    if (userId?.trim()) {
      const normalizedUserId = userId.trim();
      const [myJobsPayload, applications, alerts, profile, employerStats, employerProfile, applicants] =
        await Promise.all([
          this.getJobs({ userId: normalizedUserId, limit: 50 }),
          this.getJobApplications(normalizedUserId),
          this.getJobAlerts(normalizedUserId),
          this.getCareerProfile(normalizedUserId),
          this.getEmployerStats(normalizedUserId),
          this.getEmployerProfile(normalizedUserId),
          this.getApplicantsForRecruiter(normalizedUserId),
        ]);

      payload.myJobs = myJobsPayload.jobs;
      payload.applications = applications;
      payload.alerts = alerts;
      payload.profile = profile;
      payload.employerStats = employerStats;
      payload.employerProfile = employerProfile;
      payload.applicants = applicants;
    }

    return payload;
  }

  async getJob(id: string) {
    const job = await this.prisma.job.findFirst({
      where: { id, deletedAt: null },
    });
    if (!job) {
      throw new NotFoundException(`Job ${id} not found`);
    }
    return this.mapJob(job);
  }

  async createJob(recruiterId: string, body: CreateJobDto) {
    await this.coreDatabase.getUser(recruiterId);
    const { min, max } = this.parseSalaryRange(body.salary);
    const job = await this.prisma.job.create({
      data: {
        id: makeId('job'),
        recruiterId,
        title: body.title,
        company: body.company,
        description: `${body.title} at ${body.company}`,
        location: body.location,
        type: body.type ?? 'remote',
        experienceLevel: body.experienceLevel ?? 'entry',
        salaryMin: min,
        salaryMax: max,
        status: 'open',
      },
    });
    return this.mapJob(job);
  }

  async applyForJob(jobId: string, applicantId: string, applicantName: string) {
    await Promise.all([this.getJob(jobId), this.coreDatabase.getUser(applicantId)]);
    const application = await this.prisma.jobApplication.upsert({
      where: {
        jobId_applicantId: {
          jobId,
          applicantId,
        },
      },
      create: {
        id: makeId('application'),
        jobId,
        applicantId,
        applicantName,
        coverLetter: null,
        resumeUrl: null,
        metadata: {} as Prisma.InputJsonValue,
        status: 'submitted',
      },
      update: {
        applicantName,
        status: 'submitted',
        updatedAt: new Date(),
      },
    });
    return this.mapJobApplication(application);
  }

  async getJobApplications(applicantId?: string) {
    const applications = await this.prisma.jobApplication.findMany({
      where: applicantId ? { applicantId } : undefined,
      include: {
        job: true,
        applicant: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return applications.map((row) =>
      this.mapJobApplication({
        ...row,
        jobTitle: row.job.title,
        company: row.job.company,
        applicantSkills: this.jsonStringArray(row.applicant.interests),
      }),
    );
  }

  async getJobAlerts(userId: string) {
    const [user, settings] = await Promise.all([
      this.coreDatabase.getUser(userId),
      this.getUserSettingsState(userId),
    ]);
    const jobsState = this.readJobsState(settings);
    const storedAlerts = Array.isArray(jobsState.alerts)
      ? jobsState.alerts
          .map((item: unknown, index: number) => this.normalizeJobAlert(item, index, user.location))
          .filter((item): item is ReturnType<ExperienceDatabaseService['normalizeJobAlert']> =>
            Boolean(item),
          )
      : [];

    if (storedAlerts.length > 0) {
      return storedAlerts;
    }

    const recentApplications = await this.prisma.jobApplication.findMany({
      where: { applicantId: userId },
      include: { job: true },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });

    const keywords = [
      ...recentApplications.map((item) => item.job.title),
      ...this.jsonStringArray(user.interests),
    ]
      .map((item) => item.trim())
      .filter(Boolean);
    const uniqueKeywords = [...new Set(keywords)].slice(0, 3);
    const alerts = (uniqueKeywords.length > 0 ? uniqueKeywords : ['Open roles']).map(
      (keyword, index) => ({
        id: `job_alert_${userId}_${index + 1}`,
        keyword,
        location: user.location?.trim() || recentApplications[0]?.job.location || 'Any',
        frequency: index === 0 ? 'daily' : 'weekly',
        enabled: true,
      }),
    );

    await this.mergeUserSettingsState(userId, {
      jobs: {
        ...jobsState,
        alerts,
      },
    });

    return alerts;
  }

  async getCareerProfile(userId: string) {
    const [user, settings, applications] = await Promise.all([
      this.coreDatabase.getUser(userId),
      this.getUserSettingsState(userId),
      this.prisma.jobApplication.findMany({
        where: { applicantId: userId },
        include: { job: true },
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
    ]);
    const jobsState = this.readJobsState(settings);
    const storedProfile =
      jobsState.careerProfile && typeof jobsState.careerProfile === 'object'
        ? this.toObject(jobsState.careerProfile as Prisma.JsonValue)
        : null;

    if (storedProfile && Object.keys(storedProfile).length > 0) {
      return storedProfile;
    }

    const experience = applications.map(
      (item) => `${this.titleCase(item.status)} application for ${item.job.title} at ${item.job.company}`,
    );
    const skills = [
      ...this.jsonStringArray(user.interests),
      ...applications.flatMap((item) => this.jsonStringArray(item.job.skills)),
    ];
    const profile = {
      name: user.name,
      title: applications[0]?.job.title ?? this.titleCase(String(user.role ?? 'professional')),
      skills: [...new Set(skills)].slice(0, 12),
      experience: [...new Set(experience)].slice(0, 8),
      education: this.readStringArray(storedProfile?.education).slice(0, 6),
      resumeLabel:
        this.readString(storedProfile?.resumeLabel) ??
        this.readString(applications[0]?.metadata, 'resumeLabel') ??
        'Primary resume',
      portfolioLinks: this.readStringArray(storedProfile?.portfolioLinks).slice(0, 6),
      availability:
        this.readString(storedProfile?.availability) ??
        (applications.length > 0 ? 'Open to work' : 'Exploring opportunities'),
    };

    await this.mergeUserSettingsState(userId, {
      jobs: {
        ...jobsState,
        careerProfile: profile,
      },
    });

    return profile;
  }

  async getEmployerStats(userId: string) {
    const [jobs, applications, messageCount] = await Promise.all([
      this.prisma.job.findMany({
        where: { recruiterId: userId, deletedAt: null },
      }),
      this.prisma.jobApplication.findMany({
        where: {
          job: {
            recruiterId: userId,
          },
        },
      }),
      this.prisma.chatThreadParticipant.count({
        where: { userId },
      }),
    ]);

    return {
      totalJobs: jobs.length,
      openJobs: jobs.filter((job) => job.status === 'open').length,
      totalApplicants: applications.length,
      shortlistedCandidates: applications.filter((item) =>
        ['shortlisted', 'viewed'].includes(item.status.toLowerCase()),
      ).length,
      messages: messageCount,
    };
  }

  async getEmployerProfile(userId: string) {
    const [user, settings, jobs, stats] = await Promise.all([
      this.coreDatabase.getUser(userId),
      this.getUserSettingsState(userId),
      this.prisma.job.findMany({
        where: { recruiterId: userId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.getEmployerStats(userId),
    ]);
    const jobsState = this.readJobsState(settings);
    const storedProfile =
      jobsState.employerProfile && typeof jobsState.employerProfile === 'object'
        ? this.toObject(jobsState.employerProfile as Prisma.JsonValue)
        : null;

    if (storedProfile && Object.keys(storedProfile).length > 0) {
      return storedProfile;
    }

    const latestJob = jobs[0];
    const hiringFocus = [
      ...jobs.flatMap((job) => this.jsonStringArray(job.skills)),
      ...jobs.map((job) => job.title),
    ];
    const profile = {
      companyName: latestJob?.company || user.name,
      hiringTitle: `${this.titleCase(String(user.role ?? 'employer'))} hiring profile`,
      about: latestJob?.description || user.bio || `Hiring from ${user.name} on OptiZenqor.`,
      location: user.location?.trim() || latestJob?.location || 'Remote',
      hiringFocus: [...new Set(hiringFocus)].slice(0, 8),
      openRoles: [...new Set(jobs.filter((job) => job.status === 'open').map((job) => job.title))].slice(
        0,
        8,
      ),
      teamHighlights: [
        `${stats.totalJobs} roles posted`,
        `${stats.totalApplicants} applicants in pipeline`,
        `${stats.shortlistedCandidates} shortlisted or reviewed`,
      ],
    };

    await this.mergeUserSettingsState(userId, {
      jobs: {
        ...jobsState,
        employerProfile: profile,
      },
    });

    return profile;
  }

  async getApplicantsForRecruiter(userId: string) {
    const applications = await this.prisma.jobApplication.findMany({
      where: {
        job: {
          recruiterId: userId,
        },
      },
      include: {
        job: true,
        applicant: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return applications.map((row) => ({
      id: row.applicantId,
      applicationId: row.id,
      name: row.applicantName || row.applicant.name,
      title: row.job.title,
      skills: this.jsonStringArray(row.applicant.interests),
      status: row.status,
      resumeLabel: this.readString(row.metadata, 'resumeLabel') ?? 'Primary resume',
      appliedDate: row.createdAt.toISOString(),
    }));
  }

  async getJobCompanies() {
    const jobs = await this.prisma.job.findMany({
      where: { deletedAt: null },
      include: {
        recruiter: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const companies = new Map<
      string,
      {
        id: string;
        name: string;
        tagline: string;
        logoInitial: string;
        colorValue: number;
        followers: number;
        followed: boolean;
        verified: boolean;
      }
    >();

    for (const job of jobs) {
      const key = job.company.trim().toLowerCase();
      if (!key) {
        continue;
      }
      const existing = companies.get(key);
      const tagline = this.compactText(job.recruiter.bio || job.description, 96);
      const next = {
        id: existing?.id ?? `company_${this.slugify(job.company)}`,
        name: job.company,
        tagline: existing?.tagline || tagline || 'Hiring on OptiZenqor',
        logoInitial: job.company.trim().charAt(0).toUpperCase() || 'C',
        colorValue: existing?.colorValue ?? this.colorFromString(job.company),
        followers: Math.max(existing?.followers ?? 0, job.recruiter.followers),
        followed: false,
        verified:
          existing?.verified ??
          Boolean(job.recruiter.emailVerified || `${job.recruiter.verification}`.toLowerCase().includes('verified')),
      };
      companies.set(key, next);
    }

    return [...companies.values()];
  }

  async getEvents(query: string | EventsQueryDto = {}) {
    const queryObject =
      typeof query === 'string' ? ({ status: query } satisfies EventsQueryDto) : query;
    const paging = this.normalizePaging(queryObject.page, queryObject.limit);
    const normalizedStatus = queryObject.status?.trim().toLowerCase();
    const where: Prisma.EventWhereInput = {
      deletedAt: null,
      status: normalizedStatus
        ? {
            equals: normalizedStatus,
            mode: 'insensitive',
          }
        : undefined,
      category: queryObject.category?.trim() || undefined,
      organizerId: queryObject.userId?.trim() || undefined,
      OR: queryObject.search?.trim()
        ? [
            { title: { contains: queryObject.search.trim(), mode: 'insensitive' } },
            { organizerName: { contains: queryObject.search.trim(), mode: 'insensitive' } },
            { location: { contains: queryObject.search.trim(), mode: 'insensitive' } },
            { description: { contains: queryObject.search.trim(), mode: 'insensitive' } },
          ]
        : undefined,
    };
    const orderBy = this.resolveEventOrder(queryObject.sort, queryObject.order);
    const [events, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        orderBy,
        skip: paging.skip,
        take: paging.limit,
      }),
      this.prisma.event.count({ where }),
    ]);
    const items = events.map((row) => this.mapEvent(row));
    return {
      events: items,
      items,
      results: items,
      pagination: this.buildPagination(total, paging.page, paging.limit),
      filters: {
        status: queryObject.status?.trim() || null,
        category: queryObject.category?.trim() || null,
        userId: queryObject.userId?.trim() || null,
        search: queryObject.search?.trim() || null,
        sort: queryObject.sort?.trim() || 'createdAt',
        order: queryObject.order ?? 'desc',
      },
    };
  }

  async getEvent(id: string) {
    const event = await this.prisma.event.findFirst({
      where: { id, deletedAt: null },
    });
    if (!event) {
      throw new NotFoundException(`Event ${id} not found`);
    }
    return this.mapEvent(event);
  }

  async createEvent(organizerId: string, body: CreateEventDto) {
    const organizer = await this.coreDatabase.getUser(organizerId);
    const event = await this.prisma.event.create({
      data: {
        id: makeId('event'),
        organizerId,
        organizerName: body.organizer || organizer.name,
        title: body.title,
        description: `${body.title} hosted by ${body.organizer || organizer.name}`,
        date: body.date,
        time: body.time,
        location: body.location,
        participants: body.participants ?? 0,
        price: new Prisma.Decimal(body.price ?? 0),
        status: (body.status ?? 'Review').toLowerCase(),
      },
    });
    return this.mapEvent(event);
  }

  async toggleEventRsvp(eventId: string, userId: string) {
    await Promise.all([this.getEvent(eventId), this.coreDatabase.getUser(userId)]);
    const existing = await this.prisma.eventRsvp.findUnique({
      where: {
        eventId_userId: { eventId, userId },
      },
    });

    if (existing?.status === 'going') {
      await this.prisma.$transaction([
        this.prisma.eventRsvp.update({
          where: {
            eventId_userId: { eventId, userId },
          },
          data: { status: 'cancelled', updatedAt: new Date() },
        }),
        this.prisma.event.update({
          where: { id: eventId },
          data: { participants: { decrement: 1 }, updatedAt: new Date() },
        }),
      ]);
      return { success: true, attending: false, status: 'cancelled' };
    }

    await this.prisma.$transaction([
      this.prisma.eventRsvp.upsert({
        where: {
          eventId_userId: { eventId, userId },
        },
        create: { eventId, userId, status: 'going' },
        update: { status: 'going', updatedAt: new Date() },
      }),
      this.prisma.event.update({
        where: { id: eventId },
        data: { participants: { increment: existing ? 0 : 1 }, updatedAt: new Date() },
      }),
    ]);

    return { success: true, attending: true, status: 'going' };
  }

  async toggleEventSave(eventId: string, userId: string) {
    await Promise.all([this.getEvent(eventId), this.coreDatabase.getUser(userId)]);
    const existing = await this.prisma.eventRsvp.findUnique({
      where: {
        eventId_userId: { eventId, userId },
      },
    });
    const nextSaved = !existing?.saved;

    await this.prisma.$transaction([
      this.prisma.eventRsvp.upsert({
        where: {
          eventId_userId: { eventId, userId },
        },
        create: { eventId, userId, status: 'saved', saved: true },
        update: { saved: nextSaved, updatedAt: new Date() },
      }),
      this.prisma.event.update({
        where: { id: eventId },
        data: {
          savedCount: nextSaved ? { increment: 1 } : { decrement: 1 },
          updatedAt: new Date(),
        },
      }),
    ]);

    return { success: true, saved: nextSaved };
  }

  async getCommunities(query: CommunitiesQueryDto = {}) {
    const paging = this.normalizePaging(query.page, query.limit);
    const where: Prisma.CommunityWhereInput = {
      deletedAt: null,
      category: query.category?.trim() || undefined,
      privacy: query.privacy?.trim() || undefined,
      ownerId: query.userId?.trim() || undefined,
      OR: query.search?.trim()
        ? [
            { name: { contains: query.search.trim(), mode: 'insensitive' } },
            { description: { contains: query.search.trim(), mode: 'insensitive' } },
            { category: { contains: query.search.trim(), mode: 'insensitive' } },
            { location: { contains: query.search.trim(), mode: 'insensitive' } },
          ]
        : undefined,
    };
    const orderBy = this.resolveCommunityOrder(query.sort, query.order);
    const [communities, total] = await Promise.all([
      this.prisma.community.findMany({
        where,
        orderBy,
        skip: paging.skip,
        take: paging.limit,
      }),
      this.prisma.community.count({ where }),
    ]);
    const items = communities.map((row) => this.mapCommunity(row));
    return {
      communities: items,
      items,
      results: items,
      pagination: this.buildPagination(total, paging.page, paging.limit),
      filters: {
        category: query.category?.trim() || null,
        privacy: query.privacy?.trim() || null,
        userId: query.userId?.trim() || null,
        search: query.search?.trim() || null,
        sort: query.sort?.trim() || 'createdAt',
        order: query.order ?? 'desc',
      },
    };
  }

  async getCommunity(id: string) {
    const community = await this.prisma.community.findFirst({
      where: { id, deletedAt: null },
    });
    if (!community) {
      throw new NotFoundException(`Community ${id} not found`);
    }
    const members = await this.prisma.communityMember.findMany({
      where: { communityId: id },
      orderBy: { createdAt: 'asc' },
    });
    const events = await this.prisma.event.findMany({
      where: { organizerId: community.ownerId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return {
      ...this.mapCommunity(community),
      members: await Promise.all(members.map((row) => this.mapCommunityMember(row))),
      posts: [],
      events: events.map((row) => this.mapEvent(row)),
      pinnedPosts: [],
      trendingPosts: [],
      announcements: [],
    };
  }

  async joinCommunity(id: string, userId: string, role = 'member') {
    await Promise.all([this.getCommunity(id), this.coreDatabase.getUser(userId)]);
    const existing = await this.prisma.communityMember.findUnique({
      where: {
        communityId_userId: { communityId: id, userId },
      },
    });

    if (existing?.status === 'active') {
      const community = await this.getCommunity(id);
      return { joined: true, memberCount: community.memberCount, community };
    }

    await this.prisma.$transaction([
      this.prisma.communityMember.upsert({
        where: {
          communityId_userId: { communityId: id, userId },
        },
        create: { communityId: id, userId, role, status: 'active' },
        update: { role, status: 'active' },
      }),
      this.prisma.community.update({
        where: { id },
        data: {
          memberCount: { increment: existing ? 0 : 1 },
          updatedAt: new Date(),
        },
      }),
    ]);

    const community = await this.getCommunity(id);
    return { joined: true, memberCount: community.memberCount, community };
  }

  async leaveCommunity(id: string, userId: string) {
    const existing = await this.prisma.communityMember.findUnique({
      where: {
        communityId_userId: { communityId: id, userId },
      },
    });
    if (!existing || existing.status !== 'active') {
      const community = await this.getCommunity(id);
      return { joined: false, memberCount: community.memberCount, community };
    }

    await this.prisma.$transaction([
      this.prisma.communityMember.update({
        where: {
          communityId_userId: { communityId: id, userId },
        },
        data: { status: 'left' },
      }),
      this.prisma.community.update({
        where: { id },
        data: {
          memberCount: { decrement: 1 },
          updatedAt: new Date(),
        },
      }),
    ]);

    const community = await this.getCommunity(id);
    return { joined: false, memberCount: community.memberCount, community };
  }

  async createCommunity(input: {
    ownerId: string;
    ownerName?: string;
    name: string;
    description: string;
    privacy?: string;
    category?: string;
    location?: string;
    tags?: string[];
    rules?: string[];
    links?: string[];
    contactInfo?: string;
    coverColors?: number[];
    avatarColor?: number;
    approvalRequired?: boolean;
    allowEvents?: boolean;
    allowLive?: boolean;
    allowPolls?: boolean;
    allowMarketplace?: boolean;
    allowChatRoom?: boolean;
    notificationLevel?: string;
  }) {
    const owner = await this.coreDatabase.getUser(input.ownerId);
    const community = await this.prisma.community.create({
      data: {
        id: makeId('community'),
        ownerId: input.ownerId,
        ownerName: input.ownerName ?? owner.name,
        name: input.name,
        description: input.description,
        privacy: input.privacy ?? 'public',
        category: input.category ?? null,
        location: input.location ?? null,
        tags: (input.tags ?? []) as Prisma.InputJsonValue,
        rules: (input.rules ?? []) as Prisma.InputJsonValue,
        links: (input.links ?? []) as Prisma.InputJsonValue,
        contactInfo: input.contactInfo ?? null,
        coverColors: (input.coverColors ?? []) as Prisma.InputJsonValue,
        avatarColor: input.avatarColor ?? null,
        approvalRequired: input.approvalRequired ?? false,
        allowEvents: input.allowEvents ?? true,
        allowLive: input.allowLive ?? false,
        allowPolls: input.allowPolls ?? true,
        allowMarketplace: input.allowMarketplace ?? false,
        allowChatRoom: input.allowChatRoom ?? true,
        notificationLevel: input.notificationLevel ?? 'all',
        memberCount: 1,
      },
    });

    await this.prisma.communityMember.create({
      data: {
        communityId: community.id,
        userId: input.ownerId,
        role: 'owner',
        status: 'active',
      },
    });

    return this.getCommunity(community.id);
  }

  async updateCommunity(
    id: string,
    patch: Record<string, unknown>,
  ) {
    const existing = await this.prisma.community.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException(`Community ${id} not found`);
    }

    await this.prisma.community.update({
      where: { id },
      data: {
        name: this.asString(patch.name) ?? undefined,
        description: this.asString(patch.description) ?? undefined,
        privacy: this.asString(patch.privacy) ?? undefined,
        category: this.asString(patch.category) ?? undefined,
        location: this.asString(patch.location) ?? undefined,
        tags: Array.isArray(patch.tags) ? (patch.tags as Prisma.InputJsonValue) : undefined,
        rules: Array.isArray(patch.rules) ? (patch.rules as Prisma.InputJsonValue) : undefined,
        links: Array.isArray(patch.links) ? (patch.links as Prisma.InputJsonValue) : undefined,
        contactInfo: this.asString(patch.contactInfo) ?? undefined,
        coverColors: Array.isArray(patch.coverColors)
          ? (patch.coverColors as Prisma.InputJsonValue)
          : undefined,
        avatarColor:
          typeof patch.avatarColor === 'number' && Number.isFinite(patch.avatarColor)
            ? patch.avatarColor
            : undefined,
        approvalRequired:
          typeof patch.approvalRequired === 'boolean' ? patch.approvalRequired : undefined,
        allowEvents: typeof patch.allowEvents === 'boolean' ? patch.allowEvents : undefined,
        allowLive: typeof patch.allowLive === 'boolean' ? patch.allowLive : undefined,
        allowPolls: typeof patch.allowPolls === 'boolean' ? patch.allowPolls : undefined,
        allowMarketplace:
          typeof patch.allowMarketplace === 'boolean' ? patch.allowMarketplace : undefined,
        allowChatRoom:
          typeof patch.allowChatRoom === 'boolean' ? patch.allowChatRoom : undefined,
        notificationLevel: this.asString(patch.notificationLevel) ?? undefined,
        updatedAt: new Date(),
      },
    });

    return this.getCommunity(id);
  }

  async getPages(query: PagesQueryDto = {}) {
    const paging = this.normalizePaging(query.page, query.limit);
    const where: Prisma.PageWhereInput = {
      ownerId: query.ownerId?.trim() || undefined,
      category: query.category?.trim() || undefined,
      OR: query.search?.trim()
        ? [
            { name: { contains: query.search.trim(), mode: 'insensitive' } },
            { about: { contains: query.search.trim(), mode: 'insensitive' } },
            { category: { contains: query.search.trim(), mode: 'insensitive' } },
            { location: { contains: query.search.trim(), mode: 'insensitive' } },
          ]
        : undefined,
    };
    const orderBy = this.resolvePageOrder(query.sort, query.order);
    const [pages, total] = await Promise.all([
      this.prisma.page.findMany({
        where,
        orderBy,
        skip: paging.skip,
        take: paging.limit,
      }),
      this.prisma.page.count({ where }),
    ]);
    const items = pages.map((row) => this.mapPage(row));
    return {
      pages: items,
      items,
      results: items,
      pagination: this.buildPagination(total, paging.page, paging.limit),
      filters: {
        category: query.category?.trim() || null,
        ownerId: query.ownerId?.trim() || null,
        search: query.search?.trim() || null,
        sort: query.sort?.trim() || 'createdAt',
        order: query.order ?? 'desc',
      },
    };
  }

  async getPage(id: string) {
    const page = await this.prisma.page.findUnique({ where: { id } });
    if (!page) {
      throw new NotFoundException(`Page ${id} not found`);
    }
    return this.mapPage(page);
  }

  async createPage(body: CreatePageDto) {
    await this.coreDatabase.getUser(body.ownerId);
    const page = await this.prisma.page.create({
      data: {
        id: makeId('page'),
        ownerId: body.ownerId,
        name: body.name,
        about: body.about,
        category: body.category,
        location: body.location ?? null,
        contactLabel: body.contactLabel ?? null,
      },
    });
    return this.mapPage(page);
  }

  async togglePageFollow(pageId: string, userId: string) {
    await Promise.all([this.getPage(pageId), this.coreDatabase.getUser(userId)]);
    const existing = await this.prisma.pageFollow.findUnique({
      where: {
        pageId_userId: { pageId, userId },
      },
    });

    if (existing) {
      await this.prisma.$transaction([
        this.prisma.pageFollow.delete({
          where: {
            pageId_userId: { pageId, userId },
          },
        }),
        this.prisma.page.update({
          where: { id: pageId },
          data: { followerCount: { decrement: 1 }, updatedAt: new Date() },
        }),
      ]);
      return { success: true, following: false };
    }

    await this.prisma.$transaction([
      this.prisma.pageFollow.create({
        data: { pageId, userId },
      }),
      this.prisma.page.update({
        where: { id: pageId },
        data: { followerCount: { increment: 1 }, updatedAt: new Date() },
      }),
    ]);

    return { success: true, following: true };
  }

  private async buildSellerProfiles(
    sellerIds: string[],
    products: Array<{ sellerId: string }>,
  ) {
    return Promise.all(
      sellerIds.map((sellerId) =>
        this.buildSellerProfile(
          sellerId,
          products.filter((item) => item.sellerId === sellerId),
        ),
      ),
    );
  }

  private async buildSellerProfile(
    sellerId: string,
    products: Array<{ sellerId: string }>,
  ) {
    const seller = await this.coreDatabase.getUser(sellerId).catch(() => null);
    return {
      id: seller?.id ?? sellerId,
      name: seller?.name ?? 'Unknown Seller',
      username: seller?.username ?? sellerId,
      avatar: seller?.avatar ?? 'https://placehold.co/120x120',
      bio: seller?.bio ?? '',
      verified: seller?.verified ?? false,
      role: seller?.role ?? 'seller',
      followers: seller?.followers ?? 0,
      following: seller?.following ?? 0,
      activeListings: products.length,
      completedOrders: Math.max(0, products.length * 12),
      storeName: seller?.name ?? 'Unknown Seller',
      strikeStatus: seller?.status === 'Suspended' ? 'Under review' : 'No warnings',
    };
  }

  private mapMarketplaceProduct(row: {
    id: string;
    sellerId: string;
    title: string;
    description: string;
    price: Prisma.Decimal;
    category: string;
    subcategory: string | null;
    condition: string | null;
    location: string | null;
    images: Prisma.JsonValue;
    status: string;
    stock: number;
    watchers: number;
    views: number;
    createdAt: Date;
  }) {
    return {
      id: row.id,
      sellerId: row.sellerId,
      title: row.title,
      description: row.description,
      price: Number(row.price),
      category: row.category,
      subcategory: row.subcategory ?? '',
      condition: row.condition ?? '',
      location: row.location ?? '',
      images: Array.isArray(row.images) ? row.images : [],
      status: row.status,
      stock: row.stock,
      watchers: row.watchers,
      views: row.views,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private mapMarketplaceOrder(row: {
    id: string;
    productId: string;
    buyerId: string;
    sellerId: string;
    amount: Prisma.Decimal;
    address: string;
    deliveryMethod: string;
    paymentMethod: string;
    status: string;
    createdAt: Date;
  }) {
    return {
      id: row.id,
      productId: row.productId,
      buyerId: row.buyerId,
      sellerId: row.sellerId,
      amount: Number(row.amount),
      address: row.address,
      deliveryMethod: row.deliveryMethod,
      paymentMethod: row.paymentMethod,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private mapJob(row: {
    id: string;
    recruiterId: string;
    title: string;
    company: string;
    description: string;
    location: string | null;
    type: string;
    experienceLevel: string | null;
    salaryMin: number | null;
    salaryMax: number | null;
    skills: Prisma.JsonValue;
    metadata: Prisma.JsonValue;
    status: string;
    createdAt: Date;
  }) {
    const metadata = this.toObject(row.metadata);
    return {
      id: row.id,
      recruiterId: row.recruiterId,
      title: row.title,
      company: row.company,
      companyName: row.company,
      description: row.description,
      location: row.location ?? '',
      type: row.type,
      experienceLevel: row.experienceLevel ?? 'entry',
      salary:
        row.salaryMin != null || row.salaryMax != null
          ? `${row.salaryMin ?? row.salaryMax ?? 0}-${row.salaryMax ?? row.salaryMin ?? 0}`
          : '',
      skills: this.jsonStringArray(row.skills),
      responsibilities: this.readStringArray(metadata.responsibilities),
      requirements: this.readStringArray(metadata.requirements),
      benefits: this.readStringArray(metadata.benefits),
      aboutCompany: this.readString(metadata.aboutCompany) ?? '',
      quickApplyEnabled: this.readBoolean(metadata.quickApplyEnabled, true),
      verifiedEmployer: this.readBoolean(metadata.verifiedEmployer, false),
      featured: this.readBoolean(metadata.featured, false),
      remoteFriendly:
        this.readBoolean(metadata.remoteFriendly) ??
        ((row.location ?? '').toLowerCase().includes('remote') ||
          row.type.toLowerCase() === 'remote'),
      draft: row.status.toLowerCase() === 'draft',
      closed: row.status.toLowerCase() === 'closed',
      externalApplyEnabled: this.readBoolean(metadata.externalApplyEnabled, false),
      contactLink: this.readString(metadata.contactLink),
      deadlineLabel: this.readString(metadata.deadlineLabel),
      postedTime: this.toRelativeTime(row.createdAt),
      status: row.status,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private mapJobApplication(row: {
    id: string;
    jobId: string;
    applicantId: string;
    applicantName: string;
    coverLetter?: string | null;
    resumeUrl?: string | null;
    metadata?: Prisma.JsonValue;
    jobTitle?: string;
    company?: string;
    applicantSkills?: string[];
    status: string;
    createdAt: Date;
  }) {
    const metadata = this.toObject(row.metadata ?? {});
    return {
      id: row.id,
      jobId: row.jobId,
      applicantId: row.applicantId,
      applicantName: row.applicantName,
      title: row.jobTitle ?? '',
      company: row.company ?? '',
      skills: row.applicantSkills ?? [],
      coverLetter: row.coverLetter ?? '',
      portfolioLink: this.readString(metadata.portfolioLink) ?? '',
      resumeLabel: this.readString(metadata.resumeLabel) ?? 'Primary resume',
      appliedDate: row.createdAt.toISOString(),
      timeline: this.buildApplicationTimeline(row.status, row.createdAt),
      status: row.status,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private mapEvent(row: {
    id: string;
    organizerId: string;
    organizerName: string;
    title: string;
    date: string;
    time: string;
    location: string;
    participants: number;
    price: Prisma.Decimal;
    status: string;
    savedCount: number;
    createdAt: Date;
  }) {
    return {
      id: row.id,
      organizerId: row.organizerId,
      organizer: row.organizerName,
      title: row.title,
      date: row.date,
      time: row.time,
      location: row.location,
      participants: row.participants,
      price: Number(row.price),
      status: this.titleCase(row.status),
      savedCount: row.savedCount,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private mapCommunity(row: {
    id: string;
    ownerId: string;
    ownerName: string;
    name: string;
    description: string;
    privacy: string;
    category: string | null;
    location: string | null;
    tags: Prisma.JsonValue;
    rules: Prisma.JsonValue;
    links: Prisma.JsonValue;
    contactInfo: string | null;
    coverColors: Prisma.JsonValue;
    avatarColor: number | null;
    approvalRequired: boolean;
    allowEvents: boolean;
    allowLive: boolean;
    allowPolls: boolean;
    allowMarketplace: boolean;
    allowChatRoom: boolean;
    notificationLevel: string;
    memberCount: number;
  }) {
    return {
      id: row.id,
      ownerId: row.ownerId,
      ownerName: row.ownerName,
      name: row.name,
      description: row.description,
      privacy: row.privacy,
      category: row.category,
      location: row.location,
      tags: Array.isArray(row.tags) ? row.tags : [],
      rules: Array.isArray(row.rules) ? row.rules : [],
      links: Array.isArray(row.links) ? row.links : [],
      contactInfo: row.contactInfo,
      coverColors: Array.isArray(row.coverColors) ? row.coverColors : [],
      avatarColor: row.avatarColor,
      approvalRequired: row.approvalRequired,
      allowEvents: row.allowEvents,
      allowLive: row.allowLive,
      allowPolls: row.allowPolls,
      allowMarketplace: row.allowMarketplace,
      allowChatRoom: row.allowChatRoom,
      notificationLevel: row.notificationLevel,
      memberCount: row.memberCount,
    };
  }

  private async mapCommunityMember(row: {
    userId: string;
    role: string;
    status: string;
    createdAt: Date;
  }) {
    const user = await this.coreDatabase.getUser(row.userId);
    return {
      id: user.id,
      name: user.name,
      username: user.username,
      avatar: user.avatar,
      role: row.role,
      status: row.status,
      joinedAt: row.createdAt.toISOString(),
    };
  }

  private mapPage(row: {
    id: string;
    ownerId: string;
    name: string;
    about: string;
    category: string;
    location: string | null;
    contactLabel: string | null;
    followerCount: number;
    createdAt: Date;
  }) {
    return {
      id: row.id,
      ownerId: row.ownerId,
      name: row.name,
      about: row.about,
      category: row.category,
      location: row.location ?? '',
      contactLabel: row.contactLabel ?? '',
      followerCount: row.followerCount,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private parseSalaryRange(value: string) {
    const matches = value.match(/\d+/g)?.map((item) => Number(item)) ?? [];
    if (matches.length === 0) {
      return { min: null, max: null };
    }
    return {
      min: matches[0] ?? null,
      max: matches[1] ?? matches[0] ?? null,
    };
  }

  private titleCase(value: string) {
    return value
      .split(/[\s_-]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }

  private asString(value: unknown) {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }

  private async getUserSettingsState(userId: string) {
    const row = await this.prisma.userSettings.findUnique({
      where: { userId },
    });
    return this.toObject(row?.settings ?? {});
  }

  private async mergeUserSettingsState(userId: string, patch: Record<string, unknown>) {
    const current = await this.getUserSettingsState(userId);
    const next = this.mergeObjects(current, patch);
    await this.prisma.userSettings.upsert({
      where: { userId },
      create: {
        userId,
        settings: next as Prisma.InputJsonValue,
      },
      update: {
        settings: next as Prisma.InputJsonValue,
        updatedAt: new Date(),
      },
    });
    return next;
  }

  private readJobsState(settings: Record<string, unknown>) {
    const value = settings.jobs;
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  }

  private normalizeJobAlert(item: unknown, index: number, fallbackLocation?: string) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return null;
    }
    const record = item as Record<string, unknown>;
    const keyword = this.readString(record.keyword);
    if (!keyword) {
      return null;
    }
    return {
      id: this.readString(record.id) ?? `job_alert_${index + 1}`,
      keyword,
      location: this.readString(record.location) ?? (fallbackLocation?.trim() || 'Any'),
      frequency: this.normalizeAlertFrequency(this.readString(record.frequency)),
      enabled: this.readBoolean(record.enabled, true),
    };
  }

  private normalizeAlertFrequency(value?: string | null) {
    const normalized = (value ?? '').trim().toLowerCase();
    switch (normalized) {
      case 'instant':
      case 'weekly':
        return normalized;
      default:
        return 'daily';
    }
  }

  private buildApplicationTimeline(status: string, createdAt: Date) {
    const submittedAt = this.toRelativeTime(createdAt);
    const normalizedStatus = status.trim().toLowerCase();
    const timeline = [`Application submitted ${submittedAt}`];
    if (normalizedStatus === 'viewed' || normalizedStatus === 'shortlisted') {
      timeline.push('Viewed by hiring team');
    }
    if (normalizedStatus === 'shortlisted') {
      timeline.push('Shortlisted for next review');
    } else if (normalizedStatus === 'rejected') {
      timeline.push('Application closed');
    } else if (normalizedStatus === 'submitted') {
      timeline.push('Recruiter review pending');
    }
    return timeline;
  }

  private mergeObjects(
    target: Record<string, unknown>,
    patch: Record<string, unknown>,
  ): Record<string, unknown> {
    const next: Record<string, unknown> = { ...target };
    for (const [key, value] of Object.entries(patch)) {
      if (
        value &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        next[key] &&
        typeof next[key] === 'object' &&
        !Array.isArray(next[key])
      ) {
        next[key] = this.mergeObjects(
          next[key] as Record<string, unknown>,
          value as Record<string, unknown>,
        );
      } else {
        next[key] = value;
      }
    }
    return next;
  }

  private readString(value: unknown, key?: string) {
    const candidate =
      key && value && typeof value === 'object' && !Array.isArray(value)
        ? (value as Record<string, unknown>)[key]
        : value;
    return typeof candidate === 'string' && candidate.trim() ? candidate.trim() : undefined;
  }

  private readStringArray(value: unknown) {
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      : [];
  }

  private readBoolean(value: unknown, fallback?: boolean) {
    if (typeof value === 'boolean') {
      return value;
    }
    return fallback;
  }

  private jsonStringArray(value: Prisma.JsonValue | unknown) {
    return Array.isArray(value)
      ? value
          .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
          .map((item) => item.trim())
      : [];
  }

  private slugify(value: string) {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'company';
  }

  private colorFromString(value: string) {
    const palette = [0xff2563eb, 0xff7c3aed, 0xfff97316, 0xff059669, 0xffdc2626];
    const hash = [...value].reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return palette[hash % palette.length];
  }

  private compactText(value: string, maxLength: number) {
    const normalized = value.replace(/\s+/g, ' ').trim();
    if (!normalized) {
      return '';
    }
    return normalized.length <= maxLength
      ? normalized
      : `${normalized.slice(0, Math.max(0, maxLength - 3)).trim()}...`;
  }

  private toRelativeTime(value: Date) {
    const diffMs = Date.now() - value.getTime();
    const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));
    if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
    }
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    }
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) {
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    }
    return value.toISOString();
  }

  private toObject(value: Prisma.JsonValue | unknown) {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  }

  private normalizePaging(page?: number, limit?: number) {
    const safePage = Number.isFinite(page) && (page ?? 0) > 0 ? Math.floor(page as number) : 1;
    const safeLimit =
      Number.isFinite(limit) && (limit ?? 0) > 0
        ? Math.min(100, Math.floor(limit as number))
        : 20;
    return {
      page: safePage,
      limit: safeLimit,
      skip: (safePage - 1) * safeLimit,
    };
  }

  private buildPagination(total: number, page: number, limit: number) {
    const totalPages = Math.max(1, Math.ceil(total / limit));
    return {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  private resolveMarketplaceOrder(sort?: string, order: 'asc' | 'desc' = 'desc') {
    const direction: Prisma.SortOrder = order === 'asc' ? 'asc' : 'desc';
    switch (sort) {
      case 'price':
        return { price: direction } satisfies Prisma.MarketplaceProductOrderByWithRelationInput;
      case 'views':
        return { views: direction } satisfies Prisma.MarketplaceProductOrderByWithRelationInput;
      case 'watchers':
        return { watchers: direction } satisfies Prisma.MarketplaceProductOrderByWithRelationInput;
      default:
        return { createdAt: direction } satisfies Prisma.MarketplaceProductOrderByWithRelationInput;
    }
  }

  private resolveJobOrder(sort?: string, order: 'asc' | 'desc' = 'desc') {
    const direction: Prisma.SortOrder = order === 'asc' ? 'asc' : 'desc';
    switch (sort) {
      case 'salaryMin':
      case 'salary':
        return { salaryMin: direction } satisfies Prisma.JobOrderByWithRelationInput;
      case 'title':
        return { title: direction } satisfies Prisma.JobOrderByWithRelationInput;
      default:
        return { createdAt: direction } satisfies Prisma.JobOrderByWithRelationInput;
    }
  }

  private resolveEventOrder(sort?: string, order: 'asc' | 'desc' = 'desc') {
    const direction: Prisma.SortOrder = order === 'asc' ? 'asc' : 'desc';
    switch (sort) {
      case 'date':
        return { date: direction } satisfies Prisma.EventOrderByWithRelationInput;
      case 'participants':
        return { participants: direction } satisfies Prisma.EventOrderByWithRelationInput;
      case 'savedCount':
        return { savedCount: direction } satisfies Prisma.EventOrderByWithRelationInput;
      default:
        return { createdAt: direction } satisfies Prisma.EventOrderByWithRelationInput;
    }
  }

  private resolveCommunityOrder(sort?: string, order: 'asc' | 'desc' = 'desc') {
    const direction: Prisma.SortOrder = order === 'asc' ? 'asc' : 'desc';
    switch (sort) {
      case 'memberCount':
        return { memberCount: direction } satisfies Prisma.CommunityOrderByWithRelationInput;
      case 'name':
        return { name: direction } satisfies Prisma.CommunityOrderByWithRelationInput;
      default:
        return { createdAt: direction } satisfies Prisma.CommunityOrderByWithRelationInput;
    }
  }

  private resolvePageOrder(sort?: string, order: 'asc' | 'desc' = 'desc') {
    const direction: Prisma.SortOrder = order === 'asc' ? 'asc' : 'desc';
    switch (sort) {
      case 'followerCount':
        return { followerCount: direction } satisfies Prisma.PageOrderByWithRelationInput;
      case 'name':
        return { name: direction } satisfies Prisma.PageOrderByWithRelationInput;
      default:
        return { createdAt: direction } satisfies Prisma.PageOrderByWithRelationInput;
    }
  }
}
