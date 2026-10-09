import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowUpRight, Box, LockKeyhole, Mail } from 'lucide-react';
import { useAuth } from './AuthProvider';

export function LoginPage() {
  const { user, loading, signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (!loading && user) return <Navigate to="/" replace />;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await signIn(email.trim(), password);
      navigate('/', { replace: true });
    } catch {
      setError('No pudimos iniciar sesión. Revisa tu correo y contraseña.');
    } finally {
      setBusy(false);
    }
  }

  return <main className="login-page">
    <div className="login-aside">
      <div className="login-brand"><span className="brand-mark"><Box size={20} /></span>paqueteo</div>
      <div className="login-art">
        <div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" />
        <div className="floating-card floating-top"><span className="mini-dot" />Paquete Miami · #024</div>
        <div className="art-box"><Box size={71} strokeWidth={1.25} /></div>
        <div className="floating-card floating-bottom"><span className="profit-mark">↗</span><span><small>Ganancia de esta semana</small><strong>$248.50</strong></span></div>
        <div className="art-spark spark-one">✳</div><div className="art-spark spark-two">✳</div>
      </div>
      <div className="login-promise"><h2>Tu negocio,<br /><em>más claro.</em></h2><p>Paquetes, gastos y ventas organizados en un solo lugar.</p></div>
      <div className="login-legal">Hecho para hacerte la vida más fácil.</div>
    </div>
    <section className="login-form-panel">
      <div className="login-form-wrap">
        <div className="mobile-login-brand"><span className="brand-mark"><Box size={18} /></span>paqueteo</div>
        <div className="eyebrow">QUÉ BUENO VERTE</div><h1>Inicia sesión</h1><p className="muted login-subtitle">Ingresa a tu espacio para seguir con tu negocio.</p>
        <form className="login-form" onSubmit={handleSubmit}>
          <label>Correo electrónico<span className="input-icon"><Mail size={17} /><input type="email" autoComplete="email" placeholder="tu@correo.com" required value={email} onChange={(e) => setEmail(e.target.value)} /></span></label>
          <label>Contraseña<span className="input-icon"><LockKeyhole size={17} /><input type="password" autoComplete="current-password" placeholder="Tu contraseña" required value={password} onChange={(e) => setPassword(e.target.value)} /></span></label>
          {error && <div className="alert error" role="alert">{error}</div>}
          <button className="button primary full" disabled={busy}>{busy ? 'Entrando…' : 'Entrar a mi cuenta'}<ArrowUpRight size={17} /></button>
        </form>
        <div className="login-note"><span className="secure-dot" />Tus datos están protegidos y solo tú puedes verlos.</div>
      </div>
    </section>
  </main>;
}
