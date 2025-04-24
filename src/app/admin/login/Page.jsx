'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/admins?password=' + encodeURIComponent(password));
      if (res.ok) {
        localStorage.setItem('adminPassword', password);
        router.push('/admin');
      } else {
        const { error } = await res.json();
        setError(error);
      }
    } catch (err) {
      setError('Error del servidor');
      
    }
  };

  return (
    <div className="admin-login">
      <h1 className="admin-login__title">Login de Administrador</h1>
      <form className="admin-login__form" onSubmit={handleSubmit}>
        <input
          type="password"
          className="admin-login__input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Ingresa la contraseña de administrador"
          required
        />
        <button type="submit" className="admin-login__button">Iniciar Sesión</button>
        {error && <p className="admin-login__error">{error}</p>}
      </form>
    </div>
  );
}