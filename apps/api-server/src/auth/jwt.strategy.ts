import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { AuthenticatedUser, JwtPayload } from './types';

interface RequestWithCookies extends Request {
  cookies: {
    access_token?: string;
    [key: string]: any;
  };
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: RequestWithCookies): string | null =>
          req.cookies?.access_token ?? null,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') ?? 'default_secret',
      passReqToCallback: false,
    });
  }

  validate(payload: JwtPayload): AuthenticatedUser {
    if (!payload.sub || !payload.first_name) {
      throw new Error('Invalid JWT payload');
    }

    return {
      userId: payload.sub,
      username: payload.username,
      first_name: payload.first_name,
      isGuest: payload.isGuest || false,
    };
  }
}
