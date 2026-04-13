import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LoaderIcon } from '../components/Icons';

export default function LoginPage() {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setName(''); setPassword(''); setPasswordConfirm(''); setInviteCode(''); setError('');
  };

  const switchMode = (m) => { setMode(m); resetForm(); };

  const handleLogin = async () => {
    if (!name || !password) { setError('Podaj imię i nazwisko oraz hasło'); return; }
    setLoading(true); setError('');
    try { await login(name.trim(), password); }
    catch (err) { setError(err.message || 'Błąd logowania'); }
    finally { setLoading(false); }
  };

  const handleRegister = async () => {
    if (!name || !password || !inviteCode) { setError('Wszystkie pola są wymagane'); return; }
    if (name.trim().length < 2) { setError('Imię musi mieć co najmniej 2 znaki'); return; }
    if (password.length < 6) { setError('Hasło musi mieć co najmniej 6 znaków'); return; }
    if (password !== passwordConfirm) { setError('Hasła nie są identyczne'); return; }
    setLoading(true); setError('');
    try { await signup(name.trim(), password, inviteCode.trim()); }
    catch (err) { setError(err.message || 'Błąd rejestracji'); }
    finally { setLoading(false); }
  };

  const handleSubmit = () => mode === 'login' ? handleLogin() : handleRegister();

  const inputStyle = {
    width: '100%', padding: '13px 16px', borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-medium)', background: 'rgba(255,255,255,0.04)',
    color: 'var(--text-primary)', fontSize: 14, fontFamily: 'var(--font-body)',
    boxSizing: 'border-box',
  };
  const labelStyle = {
    display: 'block', color: 'var(--text-secondary)', fontSize: 12,
    fontWeight: 600, marginBottom: 6, marginTop: 16,
    textTransform: 'uppercase', letterSpacing: '0.8px',
  };
  const tabStyle = (active) => ({
    flex: 1, padding: '12px 0', borderRadius: 'var(--radius-sm)',
    border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
    fontFamily: 'var(--font-body)', transition: 'all .2s',
    background: active ? 'rgba(34,211,238,0.12)' : 'transparent',
    color: active ? 'var(--accent-cyan)' : 'var(--text-muted)',
  });

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f1923 0%, #1a2a3a 50%, #0d2137 100%)',
      padding: 20,
    }}>
      <div style={{
        width: '100%', maxWidth: 440, padding: '48px 40px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        backdropFilter: 'blur(20px)',
        animation: 'fadeIn .4s ease-out',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 'var(--radius-lg)',
            background: 'var(--gradient-accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px', fontSize: 28,
          }}>🏟️</div>
          <h1 style={{
            color: 'var(--text-primary)', fontSize: 28, fontWeight: 700, margin: 0,
            fontFamily: 'var(--font-display)', letterSpacing: '-0.5px',
          }}>GramyRazem</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 8 }}>
            System rezerwacji hali sportowej
          </p>
        </div>

        {/* Zakładki */}
        <div style={{
          display: 'flex', gap: 4, marginBottom: 24, padding: 4,
          background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
        }}>
          <button onClick={() => switchMode('login')} style={tabStyle(mode === 'login')}>
            Logowanie
          </button>
          <button onClick={() => switchMode('register')} style={tabStyle(mode === 'register')}>
            Rejestracja
          </button>
        </div>

        {/* Formularz */}
        <div>
          {mode === 'register' && (
            <div>
              <label style={{ ...labelStyle, marginTop: 0 }}>Kod zaproszenia</label>
              <input
                style={{ ...inputStyle, fontFamily: 'monospace', letterSpacing: '2px', textTransform: 'uppercase' }}
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="np. A3F1B2C4"
                maxLength={8}
              />
              <p style={{ color: 'var(--text-dim)', fontSize: 11, marginTop: 4 }}>
                Kod otrzymasz od administratora systemu
              </p>
            </div>
          )}

          <label style={{ ...labelStyle, marginTop: mode === 'login' ? 0 : 16 }}>Imię i nazwisko</label>
          <input
            style={inputStyle} value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="np. Jan Kowalski"
          />

          <label style={labelStyle}>Hasło</label>
          <input
            type="password" style={inputStyle} value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="min. 6 znaków"
            onKeyDown={(e) => e.key === 'Enter' && (mode === 'login' ? handleSubmit() : null)}
          />

          {mode === 'register' && (
            <div>
              <label style={labelStyle}>Powtórz hasło</label>
              <input
                type="password" style={inputStyle} value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="powtórz hasło"
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
            </div>
          )}

          {error && (
            <p style={{ color: 'var(--accent-red)', fontSize: 13, marginTop: 12, fontWeight: 500 }}>
              {error}
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: '100%', marginTop: 24, padding: '14px 0',
              borderRadius: 'var(--radius-md)', border: 'none',
              cursor: loading ? 'wait' : 'pointer',
              background: 'var(--gradient-accent)',
              color: '#fff', fontSize: 15, fontWeight: 600,
              fontFamily: 'var(--font-body)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading && <LoaderIcon size={16} />}
            {mode === 'login' ? 'Zaloguj się' : 'Utwórz konto'}
          </button>
        </div>

        {/* Przełącznik */}
        <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', marginTop: 24 }}>
          {mode === 'login' ? (
            <>Nie masz konta?{' '}
              <span onClick={() => switchMode('register')}
                style={{ color: 'var(--accent-cyan)', cursor: 'pointer', fontWeight: 600 }}>
                Zarejestruj się
              </span>
            </>
          ) : (
            <>Masz już konto?{' '}
              <span onClick={() => switchMode('login')}
                style={{ color: 'var(--accent-cyan)', cursor: 'pointer', fontWeight: 600 }}>
                Zaloguj się
              </span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
