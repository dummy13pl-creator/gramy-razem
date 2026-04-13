import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';
import { TrashIcon, PlusIcon, LoaderIcon, UsersIcon, ShieldIcon } from './Icons';

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button onClick={handleCopy} title="Skopiuj" style={{
      padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border-subtle)',
      background: copied ? 'rgba(34,211,238,0.12)' : 'rgba(255,255,255,0.04)',
      color: copied ? 'var(--accent-cyan)' : 'var(--text-secondary)',
      fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)',
      transition: 'all .2s',
    }}>
      {copied ? 'Skopiowano!' : 'Kopiuj'}
    </button>
  );
}

function ConfirmInline({ message, onConfirm, onCancel, danger = true }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 12px', borderRadius: 10,
      background: danger ? 'rgba(239,68,68,0.08)' : 'rgba(34,211,238,0.08)',
      border: `1px solid ${danger ? 'rgba(239,68,68,0.2)' : 'rgba(34,211,238,0.2)'}`,
      animation: 'fadeIn .2s ease-out',
    }}>
      <span style={{ color: 'var(--text-secondary)', fontSize: 12, flex: 1 }}>{message}</span>
      <button onClick={onCancel} style={{
        padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border-subtle)',
        background: 'transparent', color: 'var(--text-muted)', fontSize: 11,
        fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)',
      }}>Nie</button>
      <button onClick={onConfirm} style={{
        padding: '4px 10px', borderRadius: 6, border: 'none',
        background: danger ? 'var(--accent-red)' : 'var(--accent-cyan)',
        color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer',
        fontFamily: 'var(--font-body)',
      }}>Tak</button>
    </div>
  );
}

export default function AdminPanel({ notify, currentUserId }) {
  const [tab, setTab] = useState('codes');
  const [codes, setCodes] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [genCount, setGenCount] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [confirm, setConfirm] = useState(null); // { type:'deleteUser'|'deleteCode'|'changeRole', id, extra }

  const fetchCodes = useCallback(async () => {
    try { const data = await api.getInviteCodes(); setCodes(data.codes); }
    catch (err) { notify(err.message, 'error'); }
  }, [notify]);

  const fetchUsers = useCallback(async () => {
    try { const data = await api.getUsers(); setUsers(data.users); }
    catch (err) { notify(err.message, 'error'); }
  }, [notify]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchCodes(), fetchUsers()]).finally(() => setLoading(false));
  }, [fetchCodes, fetchUsers]);

  // ── Kody ────────────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const data = await api.generateInviteCodes(genCount);
      setCodes(data.codes);
      const n = data.generated.length;
      notify(`Wygenerowano ${n} ${n === 1 ? 'kod' : n < 5 ? 'kody' : 'kodów'}`);
    } catch (err) { notify(err.message, 'error'); }
    finally { setGenerating(false); }
  };

  const handleDeleteCode = async (id) => {
    try {
      await api.deleteInviteCode(id);
      setCodes((p) => p.filter((c) => c.id !== id));
      notify('Kod usunięty');
    } catch (err) { notify(err.message, 'error'); }
    setConfirm(null);
  };

  // ── Użytkownicy ────────────────────────────────────────────────────────────
  const handleDeleteUser = async (id) => {
    try {
      await api.deleteUser(id);
      setUsers((p) => p.filter((u) => u.id !== id));
      notify('Użytkownik usunięty');
    } catch (err) { notify(err.message, 'error'); }
    setConfirm(null);
  };

  const handleChangeRole = async (id, newRole) => {
    try {
      await api.changeUserRole(id, newRole);
      setUsers((p) => p.map((u) => u.id === id ? { ...u, role: newRole } : u));
      notify(`Rola zmieniona na ${newRole === 'admin' ? 'administrator' : 'użytkownik'}`);
    } catch (err) { notify(err.message, 'error'); }
    setConfirm(null);
  };

  const unusedCodes = codes.filter((c) => !c.used_by);
  const usedCodes = codes.filter((c) => c.used_by);

  const tabStyle = (active) => ({
    padding: '10px 20px', borderRadius: 'var(--radius-sm)',
    border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
    fontFamily: 'var(--font-body)', transition: 'all .2s',
    background: active ? 'rgba(245,158,11,0.12)' : 'transparent',
    color: active ? '#fbbf24' : 'var(--text-muted)',
    display: 'flex', alignItems: 'center', gap: 6,
  });

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
        <LoaderIcon size={24} />
        <p style={{ marginTop: 8, fontSize: 14 }}>Ładowanie panelu...</p>
      </div>
    );
  }

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid rgba(245,158,11,0.15)',
      borderRadius: 18, padding: 24, marginBottom: 28,
    }}>
      <h2 style={{
        color: '#fbbf24', fontSize: 18, fontWeight: 700, margin: '0 0 20px',
        fontFamily: 'var(--font-display)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <ShieldIcon size={18} /> Panel administracyjny
      </h2>

      {/* Zakładki */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 20, padding: 4,
        background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border-subtle)',
      }}>
        <button onClick={() => setTab('codes')} style={tabStyle(tab === 'codes')}>
          🔑 Kody zaproszeń
          {unusedCodes.length > 0 && (
            <span style={{
              padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700,
              background: 'rgba(34,211,238,0.15)', color: 'var(--accent-cyan)',
            }}>{unusedCodes.length}</span>
          )}
        </button>
        <button onClick={() => setTab('users')} style={tabStyle(tab === 'users')}>
          <UsersIcon size={14} /> Użytkownicy
          <span style={{
            padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700,
            background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)',
          }}>{users.length}</span>
        </button>
      </div>

      {/* ── KODY ZAPROSZEŃ ──────────────────────────────────────────────────── */}
      {tab === 'codes' && (
        <div>
          {/* Generator */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20,
            flexWrap: 'wrap',
          }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>
              Generuj
            </span>
            <select
              value={genCount}
              onChange={(e) => setGenCount(parseInt(e.target.value))}
              style={{
                padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-medium)', background: 'rgba(255,255,255,0.04)',
                color: 'var(--text-primary)', fontSize: 13, fontFamily: 'var(--font-body)',
              }}
            >
              {[1, 2, 3, 5, 10, 20].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
              {genCount === 1 ? 'kod' : genCount < 5 ? 'kody' : 'kodów'}
            </span>
            <button
              onClick={handleGenerate}
              disabled={generating}
              style={{
                padding: '8px 16px', borderRadius: 'var(--radius-sm)', border: 'none',
                background: 'var(--gradient-accent)', color: '#fff',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                display: 'flex', alignItems: 'center', gap: 6,
                opacity: generating ? 0.6 : 1,
              }}
            >
              {generating ? <LoaderIcon size={14} /> : <PlusIcon size={14} />}
              Generuj
            </button>
          </div>

          {/* Aktywne kody */}
          {unusedCodes.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ color: 'var(--accent-green)', fontSize: 12, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
                Aktywne ({unusedCodes.length})
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {unusedCodes.map((c) => (
                  <div key={c.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                    background: 'rgba(255,255,255,0.02)', borderRadius: 10,
                    border: '1px solid var(--border-subtle)',
                  }}>
                    <code style={{
                      fontFamily: 'monospace', fontSize: 15, fontWeight: 700,
                      color: 'var(--accent-cyan)', letterSpacing: '2px', flex: 1,
                    }}>
                      {c.code}
                    </code>
                    <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>
                      {new Date(c.created_at).toLocaleDateString('pl-PL')}
                    </span>
                    <CopyButton text={c.code} />
                    {confirm?.type === 'deleteCode' && confirm?.id === c.id ? (
                      <ConfirmInline
                        message="Usunąć?"
                        onConfirm={() => handleDeleteCode(c.id)}
                        onCancel={() => setConfirm(null)}
                      />
                    ) : (
                      <button
                        onClick={() => setConfirm({ type: 'deleteCode', id: c.id })}
                        title="Usuń kod"
                        style={{
                          padding: '4px 8px', borderRadius: 6, border: 'none',
                          background: 'rgba(239,68,68,0.08)', color: '#f87171',
                          cursor: 'pointer', display: 'flex', alignItems: 'center',
                        }}
                      >
                        <TrashIcon size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Wykorzystane kody */}
          {usedCodes.length > 0 && (
            <div>
              <p style={{ color: 'var(--text-dim)', fontSize: 12, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
                Wykorzystane ({usedCodes.length})
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {usedCodes.map((c) => (
                  <div key={c.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px',
                    background: 'rgba(255,255,255,0.01)', borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.03)', opacity: 0.6,
                  }}>
                    <code style={{
                      fontFamily: 'monospace', fontSize: 13, fontWeight: 500,
                      color: 'var(--text-muted)', letterSpacing: '1px',
                      textDecoration: 'line-through',
                    }}>
                      {c.code}
                    </code>
                    <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>→</span>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', flex: 1 }}>
                      {c.usedByName}
                    </span>
                    <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>
                      {c.used_at ? new Date(c.used_at).toLocaleDateString('pl-PL') : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {codes.length === 0 && (
            <p style={{ color: 'var(--text-dim)', fontSize: 13, textAlign: 'center', padding: 20 }}>
              Brak kodów. Wygeneruj pierwsze kody zaproszenia powyżej.
            </p>
          )}
        </div>
      )}

      {/* ── UŻYTKOWNICY ─────────────────────────────────────────────────────── */}
      {tab === 'users' && (
        <div>
          {users.length === 0 && (
            <p style={{ color: 'var(--text-dim)', fontSize: 13, textAlign: 'center', padding: 20 }}>
              Brak zarejestrowanych użytkowników.
            </p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {users.map((u) => {
              const isSelf = u.id === currentUserId;
              const isAdmin = u.role === 'admin';

              return (
                <div key={u.id} style={{
                  padding: '14px 16px', borderRadius: 12,
                  background: isSelf ? 'rgba(34,211,238,0.04)' : 'rgba(255,255,255,0.02)',
                  border: isSelf ? '1px solid rgba(34,211,238,0.15)' : '1px solid var(--border-subtle)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* Awatar */}
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                      background: isAdmin ? 'var(--gradient-admin)' : 'var(--gradient-user)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontWeight: 700, fontSize: 14,
                    }}>
                      {u.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        flexWrap: 'wrap',
                      }}>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 14 }}>
                          {u.name}
                        </span>
                        {isSelf && (
                          <span style={{
                            padding: '1px 6px', borderRadius: 4, fontSize: 9,
                            fontWeight: 700, background: 'rgba(34,211,238,0.15)',
                            color: 'var(--accent-cyan)', textTransform: 'uppercase',
                          }}>Ty</span>
                        )}
                        <span style={{
                          padding: '2px 8px', borderRadius: 6, fontSize: 10,
                          fontWeight: 700, textTransform: 'uppercase',
                          display: 'inline-flex', alignItems: 'center', gap: 3,
                          background: isAdmin ? 'rgba(245,158,11,0.15)' : 'rgba(59,130,246,0.15)',
                          color: isAdmin ? '#fbbf24' : '#60a5fa',
                        }}>
                          {isAdmin ? <ShieldIcon size={10} /> : null}
                          {isAdmin ? 'admin' : 'użytkownik'}
                        </span>
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>
                        zapisów: {u.registrationCount}
                        <span style={{ margin: '0 6px', opacity: 0.4 }}>·</span>
                        od {new Date(u.created_at).toLocaleDateString('pl-PL')}
                      </div>
                    </div>

                    {/* Akcje */}
                    {!isSelf && (
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        {/* Zmiana roli */}
                        {confirm?.type === 'changeRole' && confirm?.id === u.id ? (
                          <ConfirmInline
                            message={`Zmienić na ${isAdmin ? 'użytkownika' : 'admina'}?`}
                            danger={isAdmin}
                            onConfirm={() => handleChangeRole(u.id, isAdmin ? 'user' : 'admin')}
                            onCancel={() => setConfirm(null)}
                          />
                        ) : (
                          <button
                            onClick={() => setConfirm({ type: 'changeRole', id: u.id })}
                            title={isAdmin ? 'Zmień na użytkownika' : 'Nadaj rolę admina'}
                            style={{
                              padding: '6px 12px', borderRadius: 8,
                              border: '1px solid var(--border-subtle)',
                              background: 'rgba(255,255,255,0.03)',
                              color: 'var(--text-secondary)', fontSize: 11, fontWeight: 600,
                              cursor: 'pointer', fontFamily: 'var(--font-body)',
                              display: 'flex', alignItems: 'center', gap: 4,
                            }}
                          >
                            <ShieldIcon size={11} />
                            {isAdmin ? 'Cofnij admina' : 'Nadaj admina'}
                          </button>
                        )}

                        {/* Usuwanie */}
                        {confirm?.type === 'deleteUser' && confirm?.id === u.id ? (
                          <ConfirmInline
                            message="Usunąć konto?"
                            onConfirm={() => handleDeleteUser(u.id)}
                            onCancel={() => setConfirm(null)}
                          />
                        ) : (
                          <button
                            onClick={() => setConfirm({ type: 'deleteUser', id: u.id })}
                            title="Usuń użytkownika"
                            style={{
                              padding: '6px 10px', borderRadius: 8,
                              border: '1px solid rgba(239,68,68,0.15)',
                              background: 'rgba(239,68,68,0.05)',
                              color: '#f87171', cursor: 'pointer',
                              display: 'flex', alignItems: 'center',
                            }}
                          >
                            <TrashIcon size={13} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
