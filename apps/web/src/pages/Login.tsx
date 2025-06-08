import { QRCodeCanvas } from "qrcode.react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import "./Login.css";

type LoginStatus = "loading" | "pending" | "expired" | "success";

export default function QRLogin() {
  const [qrData, setQrData] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [status, setStatus] = useState<LoginStatus>("loading");
  const { checkAuth } = useAuth();
  const navigate = useNavigate();

  const generateQR = async () => {
    setStatus("loading");
    try {
      const res = await fetch("http://localhost:3001/auth/qr/generate", {
        method: "POST",
      });
      const data = await res.json();
      setQrData(data.qrData);
      setSessionId(data.sessionId);
      setStatus("pending");
    } catch {
      setStatus("expired");
    }
  };

  useEffect(() => {
    generateQR();
  }, []);

  useEffect(() => {
    if (!sessionId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `http://localhost:3001/auth/qr/status/${sessionId}`,
          {
            credentials: "include",
          }
        );
        const data = await res.json();
        if (data.status === "confirmed") {
          setStatus("success");
          clearInterval(interval);
          setTimeout(async () => {
            await checkAuth();
            navigate("/", { replace: true });
          }, 1000);
        } else if (data.status === "expired") {
          setStatus("expired");
          clearInterval(interval);
        }
      } catch (e) {
        console.error("Error checking QR status:", e);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [sessionId, checkAuth, navigate]);

  const handleTelegramLink = () => {
    window.open(qrData, "_blank");
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(qrData);
    } catch (err) {
      console.error("Ошибка копирования:", err);
    }
  };

  const handleGuestLogin = async () => {
    try {
      const res = await fetch("http://localhost:3001/auth/guest", {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        await checkAuth();
        navigate("/", { replace: true });
      }
    } catch (error) {
      console.error("Ошибка гостевого входа:", error);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Вход через Telegram</h2>

        {status === "loading" && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Генерация QR-кода...</p>
          </div>
        )}

        {status === "pending" && (
          <div className="pending-state">
            <div className="qr-container">
              <QRCodeCanvas value={qrData} size={256} />
            </div>

            <div className="instructions">
              <p>
                Отсканируйте QR-код в мобильном Telegram, отправьте боту команду
                /start
              </p>

              <div className="alternatives">
                <p className="alternatives-title">
                  Или используйте одну из альтернатив:
                </p>

                <div className="button-group">
                  <button
                    onClick={handleTelegramLink}
                    className="telegram-button"
                  >
                    Открыть в Telegram
                  </button>

                  <button onClick={copyToClipboard} className="copy-button">
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
        )}

        {status === "expired" && (
          <div className="expired-state">
            <div className="error-icon">⚠️</div>
            <h3>QR-код истек</h3>
            <p>Время действия кода закончилось</p>
            <button onClick={generateQR} className="refresh-button">
              🔄 Создать новый QR-код
            </button>
          </div>
        )}

        {status === "success" && (
          <div className="success-state">
            <div className="success-icon">✅</div>
            <h3>Вход выполнен успешно!</h3>
            <p>Перенаправление на главную страницу...</p>
          </div>
        )}
        <div className="guest-login">
          <div className="divider">
            <span>или</span>
          </div>
          <button onClick={handleGuestLogin} className="guest-button">
            Войти как гость
          </button>
        </div>
      </div>
    </div>
  );
}
