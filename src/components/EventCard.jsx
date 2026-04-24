import { useState } from 'react';
import { ClockIcon, MapPinIcon, UsersIcon, CheckIcon, XIcon, EditIcon, TrashIcon } from './Icons';

export default function EventCard({ event, userId, isAdmin, onRegister, onUnregister, onEdit, onDelete }) {
  const [hovered, setHovered] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const spotsLeft = event.capacity - event.registrations.length;
  const isFull = spotsLeft <= 0;
  const isRegistered = event.registrations.some((r) => r.userId === userId);
  const isPast = new Date(event.date + 'T' + event.time) < new Date();
  const pct = Math.round((event.registrations.length / event.capacity) * 100);

  const dateObj = new Date(event.date + 'T00:00:00');
  const dayName = dateObj.toLocaleDateString('pl-PL', { weekday: 'short' });
  const dayNum = dateObj.getDate();
  const monthName = dateObj.toLocaleDateString('pl-PL', { month: 'short' });

  const handleAction = async (fn) => {
    setActionLoading(true);
    try {
      await fn();
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--bg-card)',
        border: hovered ? '1px solid var(--border-accent)' : '1px solid var(--border-subtle)',
        borderRadius: 18, padding: 24, transition: 'all .25s',
        opacity: isPast ? 0.5 : 1,
        transform: hovered ? 'translateY(-2px)' : 'none',
        boxShadow: hovered ? 'var(--shadow-md)' : 'none',
      }}
    >
      <div style={{ display: 'flex', gap: 16 }}>
        {/* Date badge */}
        <div style={{
          width: 62, minHeight: 70, borderRadius: 14, flexShrink: 0,
          background: 'linear-gradient(135deg, rgba(34,211,238,0.12), rgba(59,130,246,0.12))',
          border: '1px solid rgba(34,211,238,0.15)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '8px 0',
        }}>
          <span style={{ color: 'var(--accent-cyan)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {dayName}
          </span>
          <span style={{ color: 'var(--text-primary)', fontSize: 24, fontWeight: 800, lineHeight: 1.1 }}>
            {dayNum}
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 500 }}>
            {monthName}
          </span>
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <h3 style={{
              color: 'var(--text-primary)', fontSize: 17, fontWeight: 700, margin: 0,
              fontFamily: 'var(--font-display)',
            }}>
              {event.title}
            </h3>
            {isPast && (
              <span style={{
                padding: '3px 10px', borderRadius: 8, fontSize: 11,
                fontWeight: 700, background: 'rgba(100,116,139,0.2)', color: 'var(--text-muted)',
                flexShrink: 0,
              }}>ZAKOŃCZONE</span>
            )}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', marginTop: 10, color: 'var(--text-muted)', fontSize: 13 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <ClockIcon /> {event.time}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <MapPinIcon /> {event.location}
            </span>
          </div>

          {/* Capacity bar */}
          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-secondary)', fontSize: 13 }}>
                <UsersIcon />
                {event.registrations.length} / {event.capacity}
              </span>
              <span style={{
                fontSize: 12, fontWeight: 600,
                color: isFull ? 'var(--accent-red)' : spotsLeft <= 3 ? 'var(--accent-amber)' : 'var(--accent-green)',
              }}>
                {isFull ? 'Brak miejsc' : `${spotsLeft} wolnych`}
              </span>
            </div>
            <div style={{
              height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', borderRadius: 2, transition: 'width .4s ease',
                width: `${pct}%`,
                background: isFull ? 'var(--accent-red)' : pct > 70 ? 'var(--accent-amber)' : 'var(--gradient-accent)',
              }} />
            </div>
          </div>

          {/* Participants */}
          {(isAdmin || isRegistered) && event.registrations.length > 0 && (
            <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {event.registrations.map((r) => (
                <span key={r.userId} style={{
                  padding: '4px 10px', borderRadius: 8, fontSize: 12,
                  background: r.userId === userId ? 'rgba(34,211,238,0.12)' : 'rgba(255,255,255,0.04)',
                  color: r.userId === userId ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                  border: r.userId === userId ? '1px solid rgba(34,211,238,0.2)' : '1px solid var(--border-subtle)',
                  fontWeight: r.userId === userId ? 600 : 400,
                }}>
                  {r.userName}{r.userId === userId ? ' (Ty)' : ''}
                </span>
              ))}
            </div>
          )}

          {/* Actions */}
          {(!isPast || isAdmin) && (
            <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
              {!isPast && !isRegistered && !isFull && (
                <button
                  onClick={() => handleAction(() => onRegister(event.id))}
                  disabled={actionLoading}
                  style={{
                    padding: '9px 18px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer',
                    background: 'var(--gradient-accent)',
                    color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)',
                    display: 'flex', alignItems: 'center', gap: 6,
                    opacity: actionLoading ? 0.6 : 1,
                  }}
                >
                  <CheckIcon size={14} /> Zapisz się
                </button>
              )}
              {!isPast && isRegistered && (
                <button
                  onClick={() => handleAction(() => onUnregister(event.id))}
                  disabled={actionLoading}
                  style={{
                    padding: '9px 18px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                    border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)',
                    color: '#f87171', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)',
                    display: 'flex', alignItems: 'center', gap: 6,
                    opacity: actionLoading ? 0.6 : 1,
                  }}
                >
                  <XIcon size={14} /> Wypisz się
                </button>
              )}
              {isAdmin && !isPast && (
                <button onClick={() => onEdit(event)} style={{
                  padding: '9px 14px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                  border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.04)',
                  color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-body)',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <EditIcon /> Edytuj
                </button>
              )}
              {isAdmin && (
                <button onClick={() => onDelete(event.id)} style={{
                  padding: '9px 14px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                  border: '1px solid rgba(239,68,68,0.15)', background: 'rgba(239,68,68,0.05)',
                  color: '#f87171', fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-body)',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <TrashIcon /> Usuń
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
