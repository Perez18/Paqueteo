import { Link, NavLink, Outlet } from 'react-router-dom';
import { Box, LayoutDashboard, LogOut, Package, Plus, Sparkles } from 'lucide-react';
import { useAuth } from '../features/auth/AuthProvider';
import { AccentThemePicker } from './AccentThemePicker';

export function AppShell() {
  const { user, signOut } = useAuth();
  const initials = (user?.email ?? 'VP').slice(0, 1).toUpperCase();
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link to="/" className="brand"><span className="brand-mark"><Box size={19} /></span><span>paquete<span className="brand-light">o</span></span></Link>
        <div className="workspace-label">ESPACIO DE TRABAJO</div>
        <nav className="side-nav" aria-label="Navegación principal">
          <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><LayoutDashboard size={18} />Resumen</NavLink>
          <NavLink to="/packages" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><Package size={18} />Mis paquetes</NavLink>
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-tip"><div className="tip-icon"><Sparkles size={15} /></div><strong>Todo en orden</strong><span>Tu inventario y tus ventas, siempre a la mano.</span></div>
        <AccentThemePicker />
        <div className="user-row">
          <div className="avatar">{initials}</div><div className="user-copy"><strong>Mi cuenta</strong><span>{user?.email}</span></div>
          <button className="icon-button subtle" aria-label="Cerrar sesión" onClick={() => void signOut()}><LogOut size={16} /></button>
        </div>
      </aside>
      <main className="main-area">
        <header className="mobile-header"><Link to="/" className="brand"><span className="brand-mark"><Box size={18} /></span>paqueteo</Link><nav className="mobile-links" aria-label="Navegación"><NavLink to="/" end>Resumen</NavLink><NavLink to="/packages">Paquetes</NavLink></nav><AccentThemePicker compact /><Link className="mobile-add" to="/packages/new" aria-label="Nuevo paquete"><Plus size={19} /></Link></header>
        <div className="main-content"><Outlet /></div>
      </main>
    </div>
  );
}
