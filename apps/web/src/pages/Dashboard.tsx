import Spinner from "../components/Spinner";
import { useAuth } from "../hooks/useAuth";
import "./Dashboard.css";

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <header className="dashboard-header">
          <h1>Добро пожаловать!</h1>
          <button onClick={logout} className="logout-button">
            Выйти
          </button>
        </header>

        <main className="dashboard-main">
          <div className="user-card">
            <h2>Информация о пользователе</h2>
            {user ? (
              <div className="user-info">
                <div className="info-item">
                  <span className="info-label">ID:</span>
                  <span className="info-value">
                    {user.isGuest ? "Гость" : user.userId}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Username:</span>
                  <span className="info-value">
                    {user.username ?? "Не указан"}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Имя:</span>
                  <span className="info-value">
                    {user.first_name ?? "Не указано"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="loading-user">
                <Spinner />
                <p>Загрузка данных пользователя...</p>
              </div>
            )}
          </div>

          {/* Дополнительные карточки для будущего функционала */}
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Статистика</h3>
              <p>Здесь будет ваша игровая статистика</p>
            </div>

            <div className="stat-card">
              <h3>Достижения</h3>
              <p>Здесь будут ваши достижения</p>
            </div>

            <div className="stat-card">
              <h3>Недавняя активность</h3>
              <p>Здесь будет история действий</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
