import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { LoadingSpinner } from './components/ui/LoadingSpinner';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ReservationsPage from './pages/ReservationsPage';
import ReservationDetailPage from './pages/ReservationDetailPage';
import UnitsPage from './pages/UnitsPage';
import GuestsPage from './pages/GuestsPage';
import CleaningsPage from './pages/CleaningsPage';
import FinancePage from './pages/FinancePage';
import UsersPage from './pages/UsersPage';
import SettingsPage from './pages/SettingsPage';

// Layout
import { AppLayout } from './components/layout/AppLayout';

function App() {
  console.log('🚀 App component loaded');
  const { user, isLoading } = useAuth();
  console.log('👤 Auth state:', { user, isLoading });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/reservations" element={<ReservationsPage />} />
        <Route path="/reservations/:id" element={<ReservationDetailPage />} />
        <Route path="/units" element={<UnitsPage />} />
        <Route path="/guests" element={<GuestsPage />} />
        <Route path="/cleanings" element={<CleaningsPage />} />
        <Route path="/finance" element={<FinancePage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/login" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppLayout>
  );
}

export default App;
