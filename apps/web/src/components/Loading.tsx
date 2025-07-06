import "./Loading.css";
import Spinner from "./Spinner";

interface LoadingProps {
  message?: string;
}

export default function Loading({
  message = "Загрузка...",
}: Readonly<LoadingProps>) {
  return (
    <div className="loading-container">
      <div className="loading-content">
        <div className="spinner">
          <Spinner />
        </div>
        <div>{message}</div>
      </div>
    </div>
  );
}
