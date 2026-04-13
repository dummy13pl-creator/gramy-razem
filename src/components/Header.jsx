import { useAuth } from '../context/AuthContext';
import { LogOutIcon, ShieldIcon, PersonIcon } from './Icons';

export default function Header() {
  const { user, logout, isAdmin } = useAuth();

  return (
    <header style={{
      padding: '16px 24px',
      borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(15,25,35,0.85)',
      backdropFilter: 'blur(12px)',
      position: 'sticky', top: 0, zIndex: 100,
    }}>
      <div style={{
        maxWidth: 960, margin: '0 auto',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 'var(--radius-sm)',
            background: 'var(--gradient-accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
          }}>
            🏟️
          </div>
          <h1 style={{
            fontSize: 18, fontWeight: 700, color: 'var(--text-primary)',
            fontFamily: 'var(--font-display)', margin: 0,
          }}>
            GramyRazem
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
              {user.name}
            </div>
            <span style={{
              padding: '2px 8px', borderRadius: 6, fontSize: 10,
              fontWeight: 700, textTransform: 'uppercase',
              display: 'inline-flex', alignItems: 'center', gap: 3,
              background: isAdmin ? 'rgba(245,158,11,0.15)' : 'rgba(59,130,246,0.15)',
              color: isAdmin ? '#fbbf24' : '#60a5fa',
            }}>
              {isAdmin ? <ShieldIcon /> : <PersonIcon />}
              {user.role}
            </span>
          </div>
          <button onClick={logout} title="Wyloguj" style={{
            background: 'rgba(255,255,255,0.06)', border: 'none',
            color: 'var(--text-secondary)',
            width: 38, height: 38, borderRadius: 'var(--radius-sm)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background .2s',
          }}>
            <LogOutIcon />
          </button>
        </div>
      </div>
    </header>
  );
}
