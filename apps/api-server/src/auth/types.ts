export interface TelegramUser {
  id: number;
  username?: string;
  first_name: string;
  last_name?: string;
}

export interface UserData {
  sub: number;
  username?: string;
  first_name: string;
  last_name?: string;
}

export interface QRLoginResponse {
  sessionId: string;
  qrData: string;
  expiresIn: number;
}

export interface QRStatusResponse {
  status: 'pending' | 'confirmed' | 'expired';
  token?: string;
  user?: UserData;
}

export interface SecurityStats {
  totalSessions: number;
  successfulLogins: number;
  blockedSessions: number;
  rateLimitHits: number;
  activeSessions: number;
  activeRateLimits: number;
}

export interface AuthenticatedUser {
  userId: number;
  username?: string;
  first_name?: string;
}

export interface TelegramUser {
  id: number;
  username?: string;
  first_name: string;
  last_name?: string;
}

export interface PendingSession {
  timestamp: number;
  resolved: boolean;
  attempts: number;
  expectedUserId?: number;
  userData?: {
    token: string;
    user: {
      sub: number;
      username?: string;
      first_name: string;
      last_name?: string;
    };
  };
}

export interface JwtPayload {
  sub: number;
  username?: string;
  first_name: string;
  last_name?: string;
  iat?: number;
  exp?: number;
}
