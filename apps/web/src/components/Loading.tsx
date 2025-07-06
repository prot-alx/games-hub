import "./Loading.css";
import Spinner from "./Spinner";

interface LoadingProps {
  message?: string;
}

export default function Loading({
  message = "Загрузка...",
}: Readonly<LoadingProps>) {
  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <Spinner />
        <div className="loading-message">{message}</div>
      </div>
    </div>
  );
}
