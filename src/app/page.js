'use client';
import "../styles/admin.css"
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  const handleAdminRedirect = () => {
    router.push('/admin/login');
  };

  return (
    <div className="home">

      <button className="home__button" onClick={handleAdminRedirect}>
        Ir al Panel de Administración
      </button>
    </div>
  );
}
