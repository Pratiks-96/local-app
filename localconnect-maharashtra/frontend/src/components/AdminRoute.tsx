import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { AppLayout } from './layout/AppLayout';

export function AdminRoute() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'ADMIN' && user?.role !== 'MODERATOR') {
    return <Navigate to="/feed" replace />;
  }

  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}
