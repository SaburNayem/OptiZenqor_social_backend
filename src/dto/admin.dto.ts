import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class AdminSessionRefreshDto {
  @ApiProperty({ example: 'admin_refresh_xxxxxxxxx' })
  @IsString()
  refreshToken!: string;
}

export class AdminUsersQueryDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ enum: ['createdAt', 'updatedAt', 'followers', 'following', 'name'] })
  @IsOptional()
  @IsIn(['createdAt', 'updatedAt', 'followers', 'following', 'name'])
  sort?: 'createdAt' | 'updatedAt' | 'followers' | 'following' | 'name';

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc';
}

export class AdminContentQueryDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ enum: ['post', 'reel', 'story'] })
  @IsOptional()
  @IsIn(['post', 'reel', 'story'])
  targetType?: 'post' | 'reel' | 'story';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}

export class AdminReportsQueryDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;
}

export class AdminAuditLogsQueryDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  action?: string;
}

export class AdminEntityListQueryDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;
}

export class AdminSupportOperationsQueryDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ['open', 'reviewing', 'resolved', 'closed'] })
  @IsOptional()
  @IsIn(['open', 'reviewing', 'resolved', 'closed'])
  status?: 'open' | 'reviewing' | 'resolved' | 'closed';

  @ApiPropertyOptional({ enum: ['low', 'normal', 'high', 'urgent'] })
  @IsOptional()
  @IsIn(['low', 'normal', 'high', 'urgent'])
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export class AdminPremiumPlanCreateDto {
  @ApiProperty()
  @IsString()
  code!: string;

  @ApiProperty()
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @Type(() => Number)
  price!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  billingInterval?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AdminPremiumPlanUpdateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  price?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  billingInterval?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AdminUpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  verification?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  blocked?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class AdminModerateContentDto {
  @ApiPropertyOptional({ enum: ['post', 'reel', 'story'] })
  @IsOptional()
  @IsIn(['post', 'reel', 'story'])
  targetType?: 'post' | 'reel' | 'story';

  @ApiPropertyOptional({ enum: ['Visible', 'Featured', 'Under review', 'Muted reach', 'Removed'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  remove?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class AdminUpdateReportDto {
  @ApiProperty({ enum: ['submitted', 'reviewing', 'resolved', 'rejected'] })
  @IsString()
  @IsIn(['submitted', 'reviewing', 'resolved', 'rejected'])
  status!: 'submitted' | 'reviewing' | 'resolved' | 'rejected';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class AdminUpdateUserStatusDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  blocked?: boolean;
}

export class AdminSettingsPatchDto {
  @ApiProperty({ type: 'object', additionalProperties: true })
  @IsObject()
  patch!: Record<string, unknown>;
}

export class AdminSupportTicketUpdateDto {
  @ApiPropertyOptional({ enum: ['open', 'reviewing', 'resolved', 'closed'] })
  @IsOptional()
  @IsIn(['open', 'reviewing', 'resolved', 'closed'])
  status?: 'open' | 'reviewing' | 'resolved' | 'closed';

  @ApiPropertyOptional({ enum: ['low', 'normal', 'high', 'urgent'] })
  @IsOptional()
  @IsIn(['low', 'normal', 'high', 'urgent'])
  priority?: 'low' | 'normal' | 'high' | 'urgent';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  adminNote?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assignedAdminId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  replyMessage?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  slaHours?: number;
}

export class AdminNotificationDeviceUpdateDto {
  @ApiProperty()
  @IsBoolean()
  isActive!: boolean;
}

export class AdminWalletSubscriptionUpdateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currentPeriodEnd?: string;
}

export class AdminNotificationCampaignCreateDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsString()
  audience!: string;

  @ApiProperty()
  @IsString()
  schedule!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;
}

export class AdminNotificationCampaignUpdateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  audience?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  schedule?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;
}

export class AdminNotificationCampaignActionDto {
  @ApiProperty({ enum: ['send', 'schedule', 'cancel', 'delete'] })
  @IsString()
  @IsIn(['send', 'schedule', 'cancel', 'delete'])
  action!: 'send' | 'schedule' | 'cancel' | 'delete';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  schedule?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class AdminMarketplaceUpsertDto {
  @ApiProperty()
  @IsString()
  sellerId!: string;

  @ApiProperty()
  @IsString()
  title!: string;

  @ApiProperty()
  @IsString()
  description!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  price!: number;

  @ApiProperty()
  @IsString()
  category!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subcategory?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  condition?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock?: number;
}

export class AdminMarketplaceUpdateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sellerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  price?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subcategory?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  condition?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock?: number;
}

export class AdminJobUpsertDto {
  @ApiProperty()
  @IsString()
  recruiterId!: string;

  @ApiProperty()
  @IsString()
  title!: string;

  @ApiProperty()
  @IsString()
  company!: string;

  @ApiProperty()
  @IsString()
  description!: string;

  @ApiProperty()
  @IsString()
  type!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  experienceLevel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  salaryMin?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  salaryMax?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];
}

export class AdminJobUpdateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  recruiterId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  company?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  experienceLevel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  salaryMin?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  salaryMax?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];
}

export class AdminEventUpsertDto {
  @ApiProperty()
  @IsString()
  organizerId!: string;

  @ApiProperty()
  @IsString()
  title!: string;

  @ApiProperty()
  @IsString()
  date!: string;

  @ApiProperty()
  @IsString()
  time!: string;

  @ApiProperty()
  @IsString()
  location!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  organizerName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  price?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;
}

export class AdminEventUpdateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  organizerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  time?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  organizerName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  price?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;
}

export class AdminCommunityUpdateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  privacy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  approvalRequired?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allowEvents?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allowLive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allowPolls?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allowMarketplace?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allowChatRoom?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notificationLevel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;
}

export class AdminPageUpdateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  about?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactLabel?: string;
}

export class RegisterPushDeviceDto {
  @ApiProperty()
  @IsString()
  token!: string;

  @ApiProperty({ enum: ['ios', 'android', 'web'] })
  @IsString()
  @IsIn(['ios', 'android', 'web'])
  platform!: 'ios' | 'android' | 'web';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deviceLabel?: string;
}

export class AdminUpdateLiveStreamDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  audience?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  commentsEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  slowModeSeconds?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdateLiveStreamStudioDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  audience?: string;

  @ApiPropertyOptional({ type: [Object] })
  @IsOptional()
  @IsArray()
  quickOptions?: Record<string, unknown>[];

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  previewImageUrl?: string;
}

export class UpdateLiveStreamModerationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  commentsEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  slowModeSeconds?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}
