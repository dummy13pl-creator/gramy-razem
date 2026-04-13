import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import { LoaderIcon } from './components/Icons';

function AppRouter() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(180deg, var(--bg-deep) 0%, var(--bg-surface) 100%)',
      }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <LoaderIcon size={32} />
          <p style={{ marginTop: 12, fontSize: 15 }}>Ładowanie...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <DashboardPage /> : <LoginPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
