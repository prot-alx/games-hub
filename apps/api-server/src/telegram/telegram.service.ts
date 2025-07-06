import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as TelegramBot from 'node-telegram-bot-api';
import { AuthService } from '../auth/auth.service';
import { TelegramUser } from 'src/auth/types';

@Injectable()
export class TelegramService implements OnModuleInit {
  private bot: TelegramBot;
  private readonly logger = new Logger(TelegramService.name);
  private readonly pendingSessions = new Map<
    number,
    { sessionId: string; userData: TelegramUser }
  >();

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

    this.bot.on('callback_query', (query) => {
      this.handleCallbackQuery(query).catch((error) => {
        this.logger.error('Ошибка в handleCallbackQuery:', error);
      });
    });

    this.bot.on('message', (msg) => {
      const text = msg.text?.trim();
      if (!text || text.startsWith('/start')) return;
      this.sendStartButton(msg.chat.id).catch((error) => {
        this.logger.error('Ошибка при показе кнопки:', error);
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

    const userData: TelegramUser & { is_bot: boolean } = {
      id: msg.from.id,
      first_name: msg.from.first_name,
      is_bot: msg.from.is_bot,
      username: msg.from.username,
      last_name: msg.from.last_name,
    };

    this.pendingSessions.set(chatId, { sessionId, userData });

    const displayName =
      (userData.first_name || userData.username) ?? `ID: ${userData.id}`;

    await this.bot.sendMessage(
      chatId,
      `🔐 Подтвердить вход на сайт?\n\n👤 Пользователь: ${displayName}`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✅ Да', callback_data: 'confirm_login' },
              { text: '❌ Нет', callback_data: 'decline_login' },
            ],
          ],
        },
      },
    );
  }

  private async handleCallbackQuery(
    query: TelegramBot.CallbackQuery,
  ): Promise<void> {
    const chatId = query.message?.chat.id;
    const messageId = query.message?.message_id;

    if (!chatId || !messageId) return;

    await this.bot.answerCallbackQuery(query.id);

    const pendingSession = this.pendingSessions.get(chatId);
    if (!pendingSession) {
      await this.bot.editMessageText(
        '❌ Сессия истекла. Отсканируйте QR-код заново.',
        {
          chat_id: chatId,
          message_id: messageId,
        },
      );
      return;
    }

    if (query.data === 'confirm_login') {
      try {
        this.authService.confirmLogin(
          pendingSession.sessionId,
          pendingSession.userData,
        );

        await this.bot.editMessageText(
          '✅ Вход подтвержден! Вернитесь на вкладку браузера!',
          {
            chat_id: chatId,
            message_id: messageId,
          },
        );
      } catch (error: unknown) {
        const message = this.getErrorMessage(error);
        this.logger.error(
          `Ошибка входа (${pendingSession.userData.id}):`,
          message,
        );

        let errorText =
          '❌ Ошибка входа. Попробуйте отсканировать QR-код заново.';

        if (message.includes('истекла')) {
          errorText = '❌ QR-код устарел. Отсканируйте новый код на сайте.';
        } else if (message.includes('использован')) {
          errorText = '❌ Этот QR-код уже использован.';
        } else if (message.includes('частые попытки')) {
          errorText = '❌ Слишком частые попытки. Подождите 2 секунды.';
        } else if (message.includes('заблокирована')) {
          errorText =
            '❌ Сессия заблокирована из-за подозрительной активности.';
        }

        await this.bot.editMessageText(errorText, {
          chat_id: chatId,
          message_id: messageId,
        });
      }
    } else if (query.data === 'decline_login') {
      await this.bot.editMessageText('❌ Вход отклонен.', {
        chat_id: chatId,
        message_id: messageId,
      });
    }

    this.pendingSessions.delete(chatId);
  }

  private async handleStartCommand(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;

    await this.bot.sendMessage(
      chatId,
      `🎮 Привет! Этот бот используется для входа на сайт через QR-код.\n\n` +
        `🌐 Перейди на сайт: https://games-hub-web.vercel.app\n` +
        `📷 На сайте появится QR-код — отсканируй его этим ботом, чтобы авторизоваться.`,
    );

    await this.sendStartButton(chatId);
  }

  private async sendStartButton(chatId: number): Promise<void> {
    await this.bot.sendMessage(chatId, '👇 Выберите действие:', {
      reply_markup: {
        keyboard: [[{ text: '/start' }]],
        resize_keyboard: true,
        one_time_keyboard: false,
      },
    });
  }
}
