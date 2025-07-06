import { QRCodeCanvas } from "qrcode.react";
import Spinner from "./Spinner";

interface Props {
  status: "loading" | "pending" | "expired" | "success" | "server_error";
  qrData: string;
  onRetry: () => void;
  onOpenLink: () => void;
  onCopyLink: () => void;
}

export default function LoginStatusRenderer({
  status,
  qrData,
  onRetry,
  onOpenLink,
  onCopyLink,
}: Readonly<Props>) {
  if (status === "loading") {
    return (
      <div className="loading-state">
        <Spinner />
        <p>Генерация QR-кода...</p>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="pending-state">
        <div className="qr-container">
          <QRCodeCanvas value={qrData} size={256} />
        </div>
        <div className="instructions">
          <p>
            Отсканируйте QR-код в Telegram и отправьте боту команду{" "}
            <code>/start</code>
          </p>
          <div className="alternatives">
            <p className="alternatives-title">
              Или используйте одну из альтернатив:
            </p>
            <div className="button-group">
              <button onClick={onOpenLink} className="telegram-button">
                Открыть в Telegram
              </button>
              <button onClick={onCopyLink} className="copy-button">
                Скопировать ссылку
              </button>
            </div>
          </div>
        </div>
        <div className="info-text">
          <p>QR-код действителен 5 минут</p>
          <p>После входа вы будете автоматически перенаправлены</p>
        </div>
      </div>
    );
  }

  if (status === "expired") {
    return (
      <div className="expired-state">
        <div className="error-icon">⚠️</div>
        <h3>QR-код истек</h3>
        <p>Время действия кода закончилось</p>
        <button onClick={onRetry} className="refresh-button">
          🔄 Создать новый QR-код
        </button>
      </div>
    );
  }

  if (status === "server_error") {
    return (
      <div className="expired-state">
        <div className="error-icon">🔌</div>
        <h3>Сервер недоступен</h3>
        <p>Не удается подключиться к серверу</p>
        <button onClick={onRetry} className="refresh-button">
          🔄 Попробовать снова
        </button>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="success-state">
        <div className="success-icon">✅</div>
        <h3>Вход выполнен успешно!</h3>
        <p>Перенаправление на главную страницу...</p>
      </div>
    );
  }

  return null;
}
