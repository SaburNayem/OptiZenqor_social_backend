import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  Max,
  Min,
  IsString,
} from 'class-validator';

export class StoryMediaTransformDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  offsetDx?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  offsetDy?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  scale?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  zIndex?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  widthFactor?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  heightFactor?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  borderRadius?: number;
}

export class CreatePostDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  authorId?: string;

  @ApiProperty()
  @IsString()
  caption!: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  media?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class UpdatePostDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  caption?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  media?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    enum: ['Visible', 'Featured', 'Under review', 'Muted reach'],
  })
  @IsOptional()
  @IsIn(['Visible', 'Featured', 'Under review', 'Muted reach'])
  status?: 'Visible' | 'Featured' | 'Under review' | 'Muted reach';
}

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @ApiPropertyOptional({ enum: ['user', 'creator', 'business'] })
  @IsOptional()
  @IsIn(['user', 'creator', 'business'])
  profileType?: 'user' | 'creator' | 'business';
}

export class ProfileTypeSetupDto {
  @ApiProperty({ enum: ['user', 'creator', 'business'] })
  @IsString()
  @IsIn(['user', 'creator', 'business'])
  profileType!: 'user' | 'creator' | 'business';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  businessName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  businessCategory?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  businessPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  businessAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  companyWebsite?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pageName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pageCategory?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pageAbout?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactLabel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;
}

export class FollowUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  followerId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  actorId?: string;
}

export class ChangePasswordRequestDto {
  @ApiProperty()
  @IsString()
  email!: string;

  @ApiProperty()
  @IsString()
  oldPassword!: string;

  @ApiProperty()
  @IsString()
  newPassword!: string;
}

export class CreateStoryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  media?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mediaItems?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  music?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isLocalFile?: boolean;

  @ApiPropertyOptional({ type: [Number] })
  @IsOptional()
  @IsArray()
  backgroundColors?: number[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  textColorValue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sticker?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  effectName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mentionUsername?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mentionUsernames?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  linkLabel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  linkUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  privacy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  collageLayout?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  textOffsetDx?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  textOffsetDy?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  textScale?: number;

  @ApiPropertyOptional({ type: [StoryMediaTransformDto] })
  @IsOptional()
  @IsArray()
  @IsObject({ each: true })
  mediaTransforms?: StoryMediaTransformDto[];
}

export class UpdateStoryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  media?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mediaItems?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  seen?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  music?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isLocalFile?: boolean;

  @ApiPropertyOptional({ type: [Number] })
  @IsOptional()
  @IsArray()
  backgroundColors?: number[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  textColorValue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sticker?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  effectName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mentionUsername?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mentionUsernames?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  linkLabel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  linkUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  privacy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  collageLayout?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  textOffsetDx?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  textOffsetDy?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  textScale?: number;

  @ApiPropertyOptional({ type: [StoryMediaTransformDto] })
  @IsOptional()
  @IsArray()
  @IsObject({ each: true })
  mediaTransforms?: StoryMediaTransformDto[];
}

export class StoryCommentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty()
  @IsString()
  comment!: string;
}

export class CreateDraftDto {
  @ApiProperty()
  @IsString()
  title!: string;

  @ApiProperty()
  @IsString()
  type!: string;
}

export class UpdateUploadDto {
  @ApiProperty({ enum: ['retry', 'cancel', 'pause'] })
  @IsIn(['retry', 'cancel', 'pause'])
  action!: 'retry' | 'cancel' | 'pause';
}

export class StoryReactionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty()
  @IsString()
  reaction!: string;
}

export class StoryViewDto {
  @ApiProperty()
  @IsString()
  userId!: string;
}

export class BuddyRequestCreateDto {
  @ApiProperty()
  @IsString()
  targetUserId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  actorId?: string;
}

export class BuddyActionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  actorId?: string;
}

export class StoryReplyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  recipientUserId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mediaPath?: string;

  @ApiPropertyOptional({ enum: ['text', 'image', 'video', 'audio', 'file'] })
  @IsOptional()
  @IsIn(['text', 'image', 'video', 'audio', 'file'])
  kind?: 'text' | 'image' | 'video' | 'audio' | 'file';
}

export class CreateReelDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  authorId?: string;

  @ApiProperty()
  @IsString()
  caption!: string;

  @ApiProperty()
  @IsString()
  audioName!: string;

  @ApiProperty()
  @IsString()
  thumbnail!: string;

  @ApiProperty()
  @IsString()
  videoUrl!: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  textOverlays?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  subtitleEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  trimInfo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  remixEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDraft?: boolean;
}

export class UpdateReelDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  caption?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  audioName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  thumbnail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  textOverlays?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  subtitleEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  trimInfo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  remixEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDraft?: boolean;
}

export class ReelCommentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty()
  @IsString()
  comment!: string;
}

export class ReelReactionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty()
  @IsString()
  reaction!: string;
}

export class CreateMessageDto {
  @ApiProperty()
  @IsString()
  senderId!: string;

  @ApiProperty()
  @IsString()
  text!: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  replyToMessageId?: string;

  @ApiPropertyOptional({ enum: ['text', 'image', 'video', 'audio', 'file'] })
  @IsOptional()
  @IsIn(['text', 'image', 'video', 'audio', 'file'])
  kind?: 'text' | 'image' | 'video' | 'audio' | 'file';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mediaPath?: string;
}

export class CreateChatThreadDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  actorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  targetUserId?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  participantIds?: string[];
}

export class CreateGroupChatDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  participantIds?: string[];
}

export class UpdateGroupChatDto {
  @ApiProperty()
  @IsString()
  name!: string;
}

export class GroupChatMemberDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({ enum: ['admin', 'moderator', 'member'] })
  @IsOptional()
  @IsIn(['admin', 'moderator', 'member'])
  role?: 'admin' | 'moderator' | 'member';
}

export class UpdateChatPreferencesDto {
  @ApiProperty({ type: 'object', additionalProperties: true })
  @IsObject()
  patch!: Record<string, unknown>;
}

export class ToggleThreadPreferenceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  actorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  value?: boolean;
}

export class UpdateChatPresenceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  online?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lastSeen?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  typingInThreadId?: string | null;
}

export class CreateCommentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  authorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  author?: string;

  @ApiProperty()
  @IsString()
  message!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  replyTo?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mentions?: string[];
}

export class CompleteOnboardingDto {
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selectedInterests?: string[];
}

export class SessionInitDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  token?: string;
}

export class SendOtpDto {
  @ApiProperty()
  @IsString()
  destination!: string;

  @ApiProperty({ enum: ['email', 'phone'] })
  @IsIn(['email', 'phone'])
  channel!: 'email' | 'phone';
}

export class ResendOtpDto {
  @ApiProperty()
  @IsString()
  destination!: string;
}

export class VerifyOtpDto {
  @ApiProperty()
  @IsString()
  code!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  destination?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;
}

export class ReactToCommentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty()
  @IsString()
  reaction!: string;
}

export class PostReactionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty()
  @IsString()
  reaction!: string;
}

export class UserActorDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userId?: string;
}

export class BlockUserDto {
  @ApiProperty()
  @IsString()
  actorId!: string;

  @ApiProperty()
  @IsString()
  targetId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

export class AddBookmarkDto {
  @ApiProperty()
  @IsString()
  id!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ enum: ['post', 'reel', 'product'] })
  @IsOptional()
  @IsIn(['post', 'reel', 'product'])
  type?: 'post' | 'reel' | 'product';
}

export class CreateSavedCollectionDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  itemIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  privacy?: string;
}

export class UpdateSavedCollectionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  privacy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  itemId?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  itemIds?: string[];
}

export class HideItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty()
  @IsString()
  targetId!: string;

  @ApiProperty({ enum: ['post', 'reel', 'story', 'comment'] })
  @IsIn(['post', 'reel', 'story', 'comment'])
  targetType!: 'post' | 'reel' | 'story' | 'comment';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

export class ArchiveEntityDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  actorId?: string;

  @ApiProperty()
  @IsString()
  targetId!: string;

  @ApiPropertyOptional({
    enum: ['post', 'story', 'reel', 'product', 'event', 'job', 'community', 'page'],
  })
  @IsOptional()
  @IsIn(['post', 'story', 'reel', 'product', 'event', 'job', 'community', 'page'])
  targetType?: 'post' | 'story' | 'reel' | 'product' | 'event' | 'job' | 'community' | 'page';
}

export class CreateEventDto {
  @ApiProperty()
  @IsString()
  title!: string;

  @ApiProperty()
  @IsString()
  organizer!: string;

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
  @IsNumber()
  participants?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiPropertyOptional({ enum: ['Featured', 'Approved', 'Review'] })
  @IsOptional()
  @IsIn(['Featured', 'Approved', 'Review'])
  status?: 'Featured' | 'Approved' | 'Review';
}

export class PaginationQueryDto {
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
  cursor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc';
}

export class MarketplaceProductsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sellerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  type?: string;
}

export class CreatePageDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsString()
  about!: string;

  @ApiProperty()
  @IsString()
  category!: string;

  @ApiProperty()
  @IsString()
  ownerId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactLabel?: string;
}

export class CommunitiesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ enum: ['public', 'private', 'hidden'] })
  @IsOptional()
  @IsIn(['public', 'private', 'hidden'])
  privacy?: 'public' | 'private' | 'hidden';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;
}

export class PagesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ownerId?: string;
}

export class CreateJobDto {
  @ApiProperty()
  @IsString()
  title!: string;

  @ApiProperty()
  @IsString()
  company!: string;

  @ApiProperty()
  @IsString()
  location!: string;

  @ApiProperty()
  @IsString()
  salary!: string;

  @ApiPropertyOptional({ enum: ['remote', 'fullTime', 'partTime', 'freelance', 'internship', 'contract', 'hybrid', 'onsite'] })
  @IsOptional()
  @IsIn(['remote', 'fullTime', 'partTime', 'freelance', 'internship', 'contract', 'hybrid', 'onsite'])
  type?: 'remote' | 'fullTime' | 'partTime' | 'freelance' | 'internship' | 'contract' | 'hybrid' | 'onsite';

  @ApiPropertyOptional({ enum: ['entry', 'mid', 'senior', 'lead'] })
  @IsOptional()
  @IsIn(['entry', 'mid', 'senior', 'lead'])
  experienceLevel?: 'entry' | 'mid' | 'senior' | 'lead';
}

export class JobsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userId?: string;
}

export class CreateMarketplaceOrderDto {
  @ApiProperty()
  @IsString()
  productId!: string;

  @ApiProperty()
  @IsString()
  address!: string;

  @ApiProperty()
  @IsString()
  deliveryMethod!: string;

  @ApiProperty()
  @IsString()
  paymentMethod!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  buyerId?: string;
}

export class CreateMarketplaceDraftDto {
  @ApiProperty()
  @IsString()
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiProperty()
  @IsString()
  category!: string;

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

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class UpdateMarketplaceDraftDto {
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
  @IsNumber()
  price?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

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

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;
}

export class CreateMarketplaceMessageDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  buyerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class CreateMarketplaceOfferDto {
  @ApiProperty()
  @IsNumber()
  amount!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  buyerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdateMarketplaceOfferDto {
  @ApiProperty({ enum: ['accepted', 'rejected', 'countered', 'cancelled'] })
  @IsIn(['accepted', 'rejected', 'countered', 'cancelled'])
  status!: 'accepted' | 'rejected' | 'countered' | 'cancelled';

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdateMarketplaceCompareDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  productIds!: string[];
}

export class UpdateMarketplaceProductStatusDto {
  @ApiProperty({ enum: ['active', 'sold', 'expired'] })
  @IsIn(['active', 'sold', 'expired'])
  status!: 'active' | 'sold' | 'expired';
}

export class LiveCommentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty()
  @IsString()
  message!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatarUrl?: string;
}

export class LiveReactionDto {
  @ApiProperty({ enum: ['like', 'love', 'wow'] })
  @IsIn(['like', 'love', 'wow'])
  type!: 'like' | 'love' | 'wow';
}

export class CreateLiveStreamDto {
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
  @IsObject({ each: true })
  quickOptions?: Record<string, unknown>[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  previewImageUrl?: string;
}

export class RefreshDiscoveryDatasetDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class EventActorDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userId?: string;
}

export class EventsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  type?: string;
}

export class CreateTicketDto {
  @ApiProperty()
  @IsString()
  subject!: string;

  @ApiProperty()
  @IsString()
  category!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  priority?: string;
}

export class CreateSupportMessageDto {
  @ApiProperty()
  @IsString()
  message!: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];
}

export class CreateNotificationCampaignDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsString()
  audience!: string;

  @ApiProperty()
  @IsString()
  schedule!: string;
}

export class SetActiveAccountDto {
  @ApiProperty()
  @IsString()
  accountId!: string;
}

export class ToggleVerificationDocumentDto {
  @ApiProperty()
  @IsString()
  documentName!: string;
}

export class UpdateVerificationStatusDto {
  @ApiProperty({ enum: ['notRequested', 'pending', 'approved', 'rejected'] })
  @IsIn(['notRequested', 'pending', 'approved', 'rejected'])
  status!: 'notRequested' | 'pending' | 'approved' | 'rejected';
}

export class SubmitVerificationRequestDto {
  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  documents?: string[];
}

export class SubmitReportDto {
  @ApiProperty()
  @IsString()
  reason!: string;
}

export class ResolveDeepLinkDto {
  @ApiProperty()
  @IsString()
  url!: string;
}

export class SetLocaleDto {
  @ApiProperty()
  @IsString()
  localeCode!: string;
}

export class VotePollDto {
  @ApiProperty()
  @IsNumber()
  optionIndex!: number;
}

export class MutedAccountActionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

export class ToggleInterestDto {
  @ApiProperty()
  @IsString()
  name!: string;
}

export class ShareRepostTrackDto {
  @ApiProperty()
  @IsString()
  targetId!: string;

  @ApiProperty()
  @IsString()
  option!: string;
}

export class CreateCallSessionDto {
  @ApiProperty()
  @IsString()
  initiatorId!: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  recipientIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  threadId?: string;

  @ApiProperty({ enum: ['voice', 'video'] })
  @IsIn(['voice', 'video'])
  mode!: 'voice' | 'video';
}

export class EndCallSessionDto {
  @ApiProperty()
  @IsString()
  endedBy!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

export class ChangeSubscriptionPlanDto {
  @ApiProperty()
  @IsString()
  planId!: string;
}

export class ManageSubscriptionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subscriptionId?: string;
}

export class MarkNotificationReadDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userId?: string;
}

export class CreateProductDto {
  @ApiProperty()
  @IsString()
  title!: string;

  @ApiProperty()
  @IsString()
  description!: string;

  @ApiProperty()
  @IsNumber()
  price!: number;

  @ApiProperty()
  @IsString()
  category!: string;

  @ApiProperty()
  @IsString()
  subcategory!: string;

  @ApiProperty()
  @IsString()
  sellerId!: string;

  @ApiProperty()
  @IsString()
  sellerName!: string;

  @ApiProperty()
  @IsString()
  location!: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiProperty()
  @IsString()
  condition!: string;
}

export class SettingsPatchDto {
  @ApiProperty({ type: 'object', additionalProperties: true })
  @IsObject()
  patch!: Record<string, unknown>;
}
