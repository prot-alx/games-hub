import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./useAuth";
import { API_URL } from "../../config/config";

type LoginStatus =
  | "loading"
  | "pending"
  | "expired"
  | "success"
  | "server_error";

export const useQRLogin = () => {
  const [qrData, setQrData] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [status, setStatus] = useState<LoginStatus>("loading");
  const { checkAuth } = useAuth();
  const navigate = useNavigate();

  const generateQR = async () => {
    setStatus("loading");
    try {
      const res = await fetch(`${API_URL}/auth/qr/generate`, {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      setQrData(data.qrData);
      setSessionId(data.sessionId);
      setStatus("pending");
    } catch (error) {
      console.error("Ошибка подключения к серверу:", error);
      setStatus("server_error");
    }
  };

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
      const res = await fetch(`${API_URL}/auth/guest`, {
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

  useEffect(() => {
    generateQR();
  }, []);

  useEffect(() => {
    if (!sessionId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/auth/qr/status/${sessionId}`, {
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

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
        setStatus("server_error");
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [sessionId, checkAuth, navigate]);

  return {
    qrData,
    sessionId,
    status,
    generateQR,
    handleTelegramLink,
    copyToClipboard,
    handleGuestLogin,
  };
};
