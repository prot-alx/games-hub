interface GuestLoginProps {
  onClick: () => void;
}

export default function GuestLogin({ onClick }: Readonly<GuestLoginProps>) {
  return (
    <div className="guest-login">
      <div className="divider">
        <span>или</span>
      </div>
      <button onClick={onClick} className="guest-button">
        Войти как гость
      </button>
    </div>
  );
}
