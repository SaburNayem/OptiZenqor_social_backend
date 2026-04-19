import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PlatformDataService } from '../data/platform-data.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly platformData: PlatformDataService) {}

  @Post('login')
  login(@Body() body: { email?: string; username?: string; password?: string }) {
    const users = this.platformData.getUsers();
    const user = users.find(
      (item) => item.email === body.email || item.username === body.username,
    );

    return {
      success: true,
      token: `mock-token-${user?.id ?? 'guest'}`,
      refreshToken: `mock-refresh-${user?.id ?? 'guest'}`,
      user: user ?? users[0],
    };
  }

  @Post('signup')
  signup(@Body() body: { name: string; username: string; email: string; role?: string }) {
    return {
      success: true,
      message: 'Signup accepted. Verification flow can continue on the client.',
      user: {
        id: `pending-${Date.now()}`,
        name: body.name,
        username: body.username,
        email: body.email,
        role: body.role ?? 'User',
      },
    };
  }

  @Post('forgot-password')
  forgotPassword(@Body() body: { email: string }) {
    return {
      success: true,
      email: body.email,
      message: 'Password reset OTP sent.',
    };
  }

  @Post('reset-password')
  resetPassword(@Body() body: { email: string; otp: string; password: string }) {
    return {
      success: true,
      email: body.email,
      message: 'Password reset completed.',
    };
  }
}
