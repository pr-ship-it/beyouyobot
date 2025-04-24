'use client';

import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  const handleAdminRedirect = () => {
    router.push('/admin/login');
  };

  return (
    <div className="home">
      <h1 className="home__title">Bot de Cotización</h1>
      <p className="home__description">
        Este es el panel de control para el bot de Telegram de cotización de USDT/MXN.
      </p>
      <button className="home__button" onClick={handleAdminRedirect}>
        Ir al Panel de Administración
      </button>
    </div>
  );
}