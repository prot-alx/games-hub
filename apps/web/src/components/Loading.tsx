interface LoadingProps {
  message?: string;
}

export default function Loading({
  message = "Загрузка...",
}: Readonly<LoadingProps>) {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-center">
        <div className="text-lg">{message}</div>
      </div>
    </div>
  );
}
