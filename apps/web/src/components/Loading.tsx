import "./Loading.css";

interface LoadingProps {
  message?: string;
}

export default function Loading({
  message = "Загрузка...",
}: Readonly<LoadingProps>) {
  return (
    <div className="loading-container">
      <div className="loading-content">{message}</div>
    </div>
  );
}
