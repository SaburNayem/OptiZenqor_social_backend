import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'maya@optizenqor.app',
    description: 'Use one of the seeded demo emails.',
  })
  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: '123456',
    description: 'Seeded demo password for all user demo accounts in this mock backend.',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password!: string;
}

export class SignupDto {
  @ApiProperty({ example: 'New User', description: 'Full name is required.' })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({
    example: 'newuser',
    description:
      'Unique username is required. Use lowercase letters, numbers, dots, and underscores only.',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @Matches(/^[a-z0-9._]+$/, {
    message:
      'username must contain only lowercase letters, numbers, dots, or underscores',
  })
  username!: string;

  @ApiProperty({ example: 'new@optizenqor.app', description: 'Email is required.' })
  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'Password123',
    description:
      'Password is required and must be at least 8 characters with upper, lower, and number.',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message:
      'password must include at least one uppercase letter, one lowercase letter, and one number',
  })
  password!: string;

  @ApiProperty({
    example: 'Password123',
    description: 'confirmPassword must exactly match password.',
  })
  @IsNotEmpty()
  @IsString()
  confirmPassword!: string;

  @ApiProperty({
    example: 'User',
    enum: ['User', 'Creator', 'Business', 'Seller', 'Recruiter'],
    description:
      'Profile role is required for signup. Allowed values: User, Creator, Business, Seller, Recruiter.',
  })
  @IsNotEmpty()
  @IsIn(['User', 'Creator', 'Business', 'Seller', 'Recruiter'], {
    message:
      'role must be one of: User, Creator, Business, Seller, Recruiter',
  })
  @IsString()
  role!: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'maya@optizenqor.app' })
  @IsNotEmpty()
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'maya@optizenqor.app' })
  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '123456' })
  @IsNotEmpty()
  @IsString()
  otp!: string;

  @ApiProperty({ example: 'Newpass123' })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password!: string;
}

export class SendOtpDto {
  @ApiProperty({ example: 'maya@optizenqor.app' })
  @IsNotEmpty()
  @IsString()
  destination!: string;

  @ApiProperty({ example: 'email', enum: ['email', 'phone'] })
  @IsIn(['email', 'phone'])
  channel!: 'email' | 'phone';
}

export class VerifyEmailConfirmDto {
  @ApiProperty({ example: 'new@optizenqor.app' })
  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '123456' })
  @IsNotEmpty()
  @IsString()
  code!: string;
}

export class ResendOtpDto {
  @ApiProperty({ example: 'maya@optizenqor.app' })
  @IsNotEmpty()
  @IsString()
  destination!: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: '123456' })
  @IsNotEmpty()
  @IsString()
  code!: string;
}

export class AdminLoginDto {
  @ApiProperty({ example: 'admin@optizenqor.app' })
  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'admin123',
    description: 'Seeded admin password for dashboard demo access.',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password!: string;
}
