import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaymentCurrency, PaymentGateway, PaymentRegion } from '../payment.enums';

export class PaymentCustomerDto {
  @ApiProperty({ example: 'Sabur' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'customer@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '+8801700000000' })
  @IsString()
  phone!: string;

  @ApiPropertyOptional({ example: 'Dhaka' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'Bangladesh' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ example: 'House 1, Road 2' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: '1207' })
  @IsOptional()
  @IsString()
  postalCode?: string;
}

export class CreatePaymentDto {
  @ApiProperty({ example: 'premium_plan' })
  @IsString()
  itemType!: string;

  @ApiPropertyOptional({ example: 'plan_monthly' })
  @IsOptional()
  @IsString()
  itemId?: string;

  @ApiProperty({ example: 'Premium monthly plan' })
  @IsString()
  title!: string;

  @ApiPropertyOptional({ example: 'Access premium features for one month.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 499 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @Max(99999999)
  amount!: number;

  @ApiProperty({ enum: PaymentCurrency, example: PaymentCurrency.BDT })
  @IsEnum(PaymentCurrency)
  currency!: PaymentCurrency;

  @ApiPropertyOptional({ enum: PaymentRegion, example: PaymentRegion.Local })
  @IsOptional()
  @IsEnum(PaymentRegion)
  region?: PaymentRegion;

  @ApiPropertyOptional({ enum: PaymentGateway, example: PaymentGateway.SSLCommerz })
  @IsOptional()
  @IsEnum(PaymentGateway)
  gateway?: PaymentGateway;

  @ApiProperty({ type: PaymentCustomerDto })
  @ValidateNested()
  @Type(() => PaymentCustomerDto)
  customer!: PaymentCustomerDto;

  @ApiPropertyOptional({ example: { source: 'premium_screen' } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
