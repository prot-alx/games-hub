import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as TelegramBot from 'node-telegram-bot-api';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class TelegramService implements OnModuleInit {
  private bot: TelegramBot;
  private readonly logger = new Logger(TelegramService.name);

  constructor(private readonly authService: AuthService) {}

  private getErrorMessage(error: unknown): string {
    if (typeof error === 'string') return error;
    if (error instanceof Error) return error.message;
    return 'Неизвестная ошибка';
  }

  onModuleInit(): void {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      this.logger.error('TELEGRAM_BOT_TOKEN не найден в переменных окружения');
      return;
    }

    this.bot = new TelegramBot(token, { polling: true });
    this.setupHandlers();
    this.logger.log('Telegram бот запущен');
  }

  private setupHandlers(): void {
    this.bot.onText(/\/start (.+)/, (msg, match) => {
      this.handleQRLogin(msg, match).catch((error) => {
        this.logger.error('Ошибка в handleQRLogin:', error);
      });
    });

    this.bot.onText(/\/start$/, (msg) => {
      this.handleStartCommand(msg).catch((error) => {
        this.logger.error('Ошибка в handleStartCommand:', error);
      });
    });

    this.bot.on('polling_error', (error) => {
      this.logger.error('Telegram polling error:', error.message);
    });
  }

  private async handleQRLogin(
    msg: TelegramBot.Message,
    match: RegExpExecArray | null,
  ): Promise<void> {
    const chatId = msg.chat.id;

    if (!match?.[1]) {
      await this.bot.sendMessage(chatId, '❌ Неверный формат команды');
      return;
    }

    if (!msg.from) {
      await this.bot.sendMessage(
        chatId,
        '❌ Не удалось получить данные пользователя',
      );
      return;
    }

    const sessionId = match[1];

    try {
      this.authService.confirmLogin(sessionId, {
        id: msg.from.id,
        username: msg.from.username,
        first_name: msg.from.first_name,
        last_name: msg.from.last_name,
      });

      await this.bot.sendMessage(chatId, '✅ Вход подтвержден!');
    } catch (error: unknown) {
      const message = this.getErrorMessage(error);

      this.logger.error(`Ошибка входа (${msg.from.id}):`, message);

      if (message.includes('истекла')) {
        await this.bot.sendMessage(
          chatId,
          '❌ QR-код устарел. Отсканируй новый код на сайте.',
        );
      } else if (message.includes('использован')) {
        await this.bot.sendMessage(chatId, '❌ Этот QR-код уже использован.');
      } else if (message.includes('частые попытки')) {
        await this.bot.sendMessage(
          chatId,
          '❌ Слишком частые попытки. Подожди 2 секунды.',
        );
      } else if (message.includes('заблокирована')) {
        await this.bot.sendMessage(
          chatId,
          '❌ Сессия заблокирована из-за подозрительной активности.',
        );
      } else {
        await this.bot.sendMessage(
          chatId,
          '❌ Ошибка входа. Попробуй отсканировать QR-код заново.',
        );
      }
    }
  }

  private async handleStartCommand(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;
    await this.bot.sendMessage(
      chatId,
      'Привет! Этот бот используется для входа на сайт через QR-код.\n\nПросто отсканируй QR-код на сайте.',
    );
  }
}
