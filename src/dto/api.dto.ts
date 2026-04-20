import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreatePostDto {
  @ApiProperty()
  @IsString()
  authorId!: string;

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
}

export class FollowUserDto {
  @ApiProperty()
  @IsString()
  followerId!: string;
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
  @ApiProperty()
  @IsString()
  userId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  media?: string;

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
}

export class StoryCommentDto {
  @ApiProperty()
  @IsString()
  userId!: string;

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
  @ApiProperty()
  @IsString()
  userId!: string;

  @ApiProperty()
  @IsString()
  reaction!: string;
}

export class CreateReelDto {
  @ApiProperty()
  @IsString()
  authorId!: string;

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
  @ApiProperty()
  @IsString()
  userId!: string;

  @ApiProperty()
  @IsString()
  comment!: string;
}

export class ReelReactionDto {
  @ApiProperty()
  @IsString()
  userId!: string;

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
}

export class CreateCommentDto {
  @ApiProperty()
  @IsString()
  author!: string;

  @ApiProperty()
  @IsString()
  message!: string;
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
}

export class ReactToCommentDto {
  @ApiProperty()
  @IsString()
  reaction!: string;
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

export class HideItemDto {
  @ApiProperty()
  @IsString()
  targetId!: string;

  @ApiProperty({ enum: ['post', 'reel', 'story', 'comment'] })
  @IsIn(['post', 'reel', 'story', 'comment'])
  targetType!: 'post' | 'reel' | 'story' | 'comment';
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

export class EventActorDto {
  @ApiProperty()
  @IsString()
  userId!: string;
}

export class CreateTicketDto {
  @ApiProperty()
  @IsString()
  subject!: string;

  @ApiProperty()
  @IsString()
  category!: string;
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
