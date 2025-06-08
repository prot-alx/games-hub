import {
  Controller,
  Post,
  Get,
  Param,
  Res,
  UseGuards,
  Request,
} from '@nestjs/common';
import { Response, Request as ExpressRequest } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { QRStatusResponse, AuthenticatedUser, UserData } from './types';

type QRStatusCheckResponse = Omit<QRStatusResponse, 'token'>;

interface AuthenticatedRequest extends ExpressRequest {
  user: AuthenticatedUser;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('qr/generate')
  generateQR() {
    return this.authService.generateQRLogin();
  }

  @Get('qr/status/:sessionId')
  checkQRStatus(
    @Param('sessionId') sessionId: string,
    @Res({ passthrough: true }) response: Response,
  ): QRStatusCheckResponse {
    const result: QRStatusResponse = this.authService.checkQRStatus(sessionId);

    if (result.status === 'confirmed' && result.token && result.user) {
      response.cookie('access_token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return {
        status: result.status,
        user: result.user,
      };
    }

    return { status: result.status };
  }

  @Post('guest')
  loginAsGuest(@Res({ passthrough: true }) response: Response): {
    user: UserData;
  } {
    const result = this.authService.generateGuestToken();

    response.cookie('access_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });

    return {
      user: result.user,
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@Request() req: AuthenticatedRequest): AuthenticatedUser {
    return req.user;
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response): { message: string } {
    response.clearCookie('access_token');
    return { message: 'Logged out successfully' };
  }
}
