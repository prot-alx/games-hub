import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { PendingSession, TelegramUser, UserData } from './types';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly pendingSessions = new Map<string, PendingSession>();
  private readonly userActionTimes = new Map<number, number>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    setInterval(() => this.cleanExpiredSessions(), 60000);
  }

  generateGuestToken(): { token: string; user: UserData } {
    const guestId = `guest_${randomBytes(8).toString('hex')}`;

    const payload: UserData = {
      sub: guestId,
      first_name: 'Гость',
      isGuest: true,
    };

    const token = this.jwtService.sign(payload, {
      expiresIn: '24h',
    });

    return { token, user: payload };
  }

  generateQRLogin(): { sessionId: string; qrData: string; expiresIn: number } {
    const sessionId = randomBytes(16).toString('hex');

    this.pendingSessions.set(sessionId, {
      timestamp: Date.now(),
      resolved: false,
      attempts: 0,
    });

    const botUsername = this.configService.get<string>('TELEGRAM_BOT_USERNAME');
    if (!botUsername) throw new Error('TELEGRAM_BOT_USERNAME не задан в .env');

    this.logger.log(`Создана QR-сессия: ${sessionId}`);

    return {
      sessionId,
      qrData: `https://t.me/${botUsername}?start=${sessionId}`,
      expiresIn: 300,
    };
  }

  confirmLogin(
    sessionId: string,
    telegramUser: TelegramUser,
  ): { success: boolean } {
    const now = Date.now();

    const last = this.userActionTimes.get(telegramUser.id);
    if (last && now - last < 2000) {
      this.logger.warn(`Rate limit для пользователя ${telegramUser.id}`);
      throw new Error('Слишком частые попытки. Попробуй через 2 секунды.');
    }
    this.userActionTimes.set(telegramUser.id, now);

    const session = this.pendingSessions.get(sessionId);
    if (!session) throw new Error('Сессия не найдена или истекла');

    session.attempts++;

    if (session.resolved) throw new Error('Сессия уже использована');
    if (now - session.timestamp > 300000) {
      this.pendingSessions.delete(sessionId);
      throw new Error('Сессия истекла. Отсканируй QR-код заново.');
    }
    if (session.attempts > 3) {
      this.pendingSessions.delete(sessionId);
      throw new Error('Слишком много попыток. Сессия заблокирована');
    }

    session.expectedUserId ??= telegramUser.id;
    if (session.expectedUserId !== telegramUser.id) {
      throw new Error('Ошибка авторизации: ID не совпадает');
    }

    const payload = {
      sub: telegramUser.id,
      username: telegramUser.username,
      first_name: telegramUser.first_name,
      last_name: telegramUser.last_name,
    };

    const token = this.jwtService.sign(payload);

    this.pendingSessions.set(sessionId, {
      ...session,
      resolved: true,
      userData: {
        token,
        user: payload,
      },
    });

    this.logger.log(
      `Успешный QR-вход: ${telegramUser.username ?? telegramUser.first_name} (${telegramUser.id})`,
    );

    return { success: true };
  }

  checkQRStatus(sessionId: string): {
    status: 'pending' | 'confirmed' | 'expired';
    token?: string;
    user?: any;
  } {
    const session = this.pendingSessions.get(sessionId);
    if (!session) return { status: 'expired' };

    if (Date.now() - session.timestamp > 300000) {
      this.pendingSessions.delete(sessionId);
      return { status: 'expired' };
    }

    if (session.resolved && session.userData) {
      setTimeout(() => this.pendingSessions.delete(sessionId), 5000);
      return {
        status: 'confirmed',
        token: session.userData.token,
        user: session.userData.user,
      };
    }

    return { status: 'pending' };
  }

  private cleanExpiredSessions(): void {
    const now = Date.now();
    let sessions = 0,
      actions = 0;

    for (const [key, session] of this.pendingSessions.entries()) {
      if (now - session.timestamp > 300000) {
        this.pendingSessions.delete(key);
        sessions++;
      }
    }

    for (const [userId, timestamp] of this.userActionTimes.entries()) {
      if (now - timestamp > 600000) {
        this.userActionTimes.delete(userId);
        actions++;
      }
    }

    if (sessions > 0 || actions > 0) {
      this.logger.log(
        `Очищено: ${sessions} сессий, ${actions} записей rate-limit`,
      );
    }
  }
}
