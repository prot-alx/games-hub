import GuestLogin from "../components/GuestLogin";
import LoginStatusRenderer from "../components/LoginStatusRenderer";
import { useQRLogin } from "../hooks/useQRLogin";
import "./Login.css";

export default function QRLogin() {
  const {
    qrData,
    status,
    generateQR,
    handleTelegramLink,
    copyToClipboard,
    handleGuestLogin,
  } = useQRLogin();

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Вход через Telegram</h2>
        <LoginStatusRenderer
          status={status}
          qrData={qrData}
          onRetry={generateQR}
          onOpenLink={handleTelegramLink}
          onCopyLink={copyToClipboard}
        />
        <GuestLogin onClick={handleGuestLogin} />
      </div>
    </div>
  );
}
