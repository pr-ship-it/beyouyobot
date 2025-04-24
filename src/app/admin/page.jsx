'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import "../../styles/admin.css";

export default function Admin() {
  const [password, setPassword] = useState('');
  const [rate, setRate] = useState('');
  const [currentRate, setCurrentRate] = useState(null);
  const [adminId, setAdminId] = useState('');
  const [action, setAction] = useState('add');
  const [trades, setTrades] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const storedPassword = localStorage.getItem('adminPassword');
    if (!storedPassword) {
      router.push('/admin/login');
    } else {
      setPassword(storedPassword);
      fetchAdmins(storedPassword);
      fetchTrades(storedPassword);
      fetchCurrentRate(storedPassword);
    }
  }, [router]);

  const fetchCurrentRate = async (pwd) => {
    try {
      const res = await fetch(`/api/admin/rate?password=${encodeURIComponent(pwd)}`);
      if (res.ok) {
        const { rate } = await res.json();
        setCurrentRate(rate);
      } else {
        const { error } = await res.json();
        setError(error);
      }
    } catch (err) {
      setError('Error al obtener la tasa actual');
    }
  };

  const fetchAdmins = async (pwd) => {
    try {
      const res = await fetch(`/api/admin/admins?password=${encodeURIComponent(pwd)}`);
      if (res.ok) {
        const { admins } = await res.json();
        setAdmins(admins);
      } else {
        const { error } = await res.json();
        setError(error);
      }
    } catch (err) {
      setError('Error del servidor');
    }
  };

  const fetchTrades = async (pwd) => {
    try {
      const res = await fetch(`/api/admin/trades?password=${encodeURIComponent(pwd)}`);
      if (res.ok) {
        const { trades } = await res.json();
        setTrades(trades);
      } else {
        const { error } = await res.json();
        setError(error);
      }
    } catch (err) {
      setError('Error del servidor');
    }
  };

  const handleRateSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, rate: parseFloat(rate) }),
      });
      if (res.ok) {
        setError('');
        setCurrentRate(parseFloat(rate));
        setRate('');
        alert('Tasa actualizada');
      } else {
        const { error } = await res.json();
        setError(error);
      }
    } catch (err) {
      setError('Error del servidor');
    }
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, action, adminId }),
      });
      if (res.ok) {
        setError('');
        fetchAdmins(password);
        setAdminId('');
        alert('Administrador actualizado');
      } else {
        const { error } = await res.json();
        setError(error);
      }
    } catch (err) {
      setError('Error del servidor');
    }
  };

  return (
    <div className="admin-dashboard">
      <h1 className="admin-dashboard__title">Panel de Administración</h1>
      <button
        className="admin-dashboard__logout"
        onClick={() => {
          localStorage.removeItem('adminPassword');
          router.push('/admin/login');
        }}
      >
        Cerrar Sesión
      </button>

      <section className="admin-dashboard__section admin-dashboard__rate-section">
        <div className="admin-dashboard-flex">
          <div className="admin-dashboard__rate-container">
            <div className="admin-dashboard__rate-form">
              <h2 className="admin-dashboard__subtitle">Establecer Tasa de Cambio</h2>
              <form className="admin-dashboard__form" onSubmit={handleRateSubmit}>
                <input
                  type="number"
                  step="0.001"
                  className="admin-dashboard__input"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  placeholder="Ingresa la tasa USDT a MXN"
                  required
                />
                <button type="submit" className="admin-dashboard__button">Actualizar Tasa</button>
              </form>
            </div>

            <div className="admin-dashboard__current-rate">
              <h3 className="admin-dashboard__current-rate-title">Tasa Actual</h3>
              <p className="admin-dashboard__current-rate-value">
                {currentRate !== null ? `${currentRate} MXN/USDT` : 'Cargando...'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="admin-dashboard__section">
        <h2 className="admin-dashboard__subtitle">Gestionar Administradores</h2>
        <form className="admin-dashboard__form" onSubmit={handleAdminSubmit}>
          <input
            type="text"
            className="admin-dashboard__input"
            value={adminId}
            onChange={(e) => setAdminId(e.target.value)}
            placeholder="Ingresa ID de Administrador"
            required
          />
          <select
            className="admin-dashboard__select"
            value={action}
            onChange={(e) => setAction(e.target.value)}
          >
            <option value="add">Agregar Administrador</option>
            <option value="remove">Eliminar Administrador</option>
          </select>
          <button type="submit" className="admin-dashboard__button">Enviar</button>
        </form>
        <ul className="admin-dashboard__list">
          {admins.map((id) => (
            <li key={id} className="admin-dashboard__list-item">{id}</li>
          ))}
        </ul>
      </section>

      <section className="admin-dashboard__section">
        <h2 className="admin-dashboard__subtitle">Historial de Transacciones</h2>
        <ul className="admin-dashboard__list">
          {trades.map((trade) => (
            <li key={trade.id} className="admin-dashboard__list-item">
              Usuario: @{trade.username}, {trade.usdtAmount} USDT, {trade.mxnAmount} MXN, Tasa: {trade.rate}
            </li>
          ))}
        </ul>
      </section>

      {error && <p className="admin-dashboard__error">{error}</p>}
    </div>
  );
}
