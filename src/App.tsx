import { Navigate, Route, Routes } from 'react-router-dom';
import { Database, ExternalLink } from 'lucide-react';
import { supabaseConfigured } from './lib/supabase';
import { useAuth } from './features/auth/AuthProvider';
import { LoginPage } from './features/auth/LoginPage';
import { ProtectedRoute } from './features/auth/ProtectedRoute';
import { AppShell } from './components/AppShell';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { PackagesPage } from './features/packages/PackagesPage';
import { PackageForm } from './features/packages/PackageForm';
import { PackageDetailPage } from './features/packages/PackageDetailPage';
import { RegisterSalePage } from './features/sales/RegisterSalePage';

function ConfigurationPage() {
  return <main className="config-page"><div className="config-card"><div className="config-icon"><Database size={23} /></div><div className="eyebrow">CASI ESTÁ TODO LISTO</div><h1>Conecta tu espacio</h1><p>Para guardar paquetes y ventas de forma segura, agrega la URL y la clave pública de tu proyecto Supabase.</p><ol><li>Copia <code>.env.example</code> como <code>.env.local</code>.</li><li>Completa <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code>.</li><li>Aplica el archivo <code>supabase/migrations/202610080001_initial_schema.sql</code> en tu proyecto.</li><li>Reinicia la aplicación.</li></ol><a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="button primary">Abrir Supabase<ExternalLink size={15} /></a></div></main>;
}

function AppRoutes() {
  const { user } = useAuth();
  return <Routes>
    <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
    <Route element={<ProtectedRoute />}><Route element={<AppShell />}>
      <Route index element={<DashboardPage />} />
      <Route path="packages" element={<PackagesPage />} />
      <Route path="packages/new" element={<PackageForm />} />
      <Route path="packages/:packageId" element={<PackageDetailPage />} />
      <Route path="packages/:packageId/sales/new" element={<RegisterSalePage />} />
    </Route></Route>
    <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
  </Routes>;
}

export default function App() {
  if (!supabaseConfigured) return <ConfigurationPage />;
  return <AppRoutes />;
}
