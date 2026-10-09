import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { LoadingState } from '../../components/LoadingState';

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingState label="Cargando tu espacio…" />;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
