import { useState } from 'react';
import { XIcon } from './Icons';

export default function EventModal({ event, onSave, onClose, saving }) {
  const isEdit = !!event;
  const [form, setForm] = useState({
    title: event?.title || '',
    date: event?.date || '',
    time: event?.time || '',
    location: event?.location || '',
    capacity: event?.capacity || 10,
  });

  const valid = form.title && form.date && form.time && form.location && form.capacity > 0;
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (valid && !saving) onSave(form);
  };

  const labelStyle = {
    display: 'block', color: 'var(--text-secondary)', fontSize: 12,
    fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.8px',
  };
  const inputStyle = {
    width: '100%', padding: '12px 14px', borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-medium)', background: 'rgba(255,255,255,0.04)',
    color: 'var(--text-primary)', fontSize: 14, fontFamily: 'var(--font-body)',
    boxSizing: 'border-box',
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20, animation: 'fadeIn .2s ease-out',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-scale-in"
        style={{
          width: '100%', maxWidth: 500, padding: '36px 32px',
          background: 'var(--bg-surface)', border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-xl)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <h2 style={{
            color: 'var(--text-primary)', fontSize: 22, fontWeight: 700,
            margin: 0, fontFamily: 'var(--font-display)',
          }}>
            {isEdit ? 'Edytuj wydarzenie' : 'Nowe wydarzenie'}
          </h2>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.06)', border: 'none', color: 'var(--text-secondary)',
            width: 36, height: 36, borderRadius: 'var(--radius-sm)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <XIcon />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={labelStyle}>Nazwa wydarzenia</label>
            <input style={inputStyle} value={form.title} onChange={(e) => set('title', e.target.value)}
              placeholder="np. Piłka nożna — mecz towarzyski" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>Data</label>
              <input type="date" style={inputStyle} value={form.date} onChange={(e) => set('date', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Godzina</label>
              <input type="time" style={inputStyle} value={form.time} onChange={(e) => set('time', e.target.value)} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Miejsce</label>
            <input style={inputStyle} value={form.location} onChange={(e) => set('location', e.target.value)}
              placeholder="np. Hala Sportowa A — boisko główne" />
          </div>

          <div>
            <label style={labelStyle}>Liczba miejsc</label>
            <input type="number" min="1" max="500" style={{ ...inputStyle, maxWidth: 140 }}
              value={form.capacity} onChange={(e) => set('capacity', parseInt(e.target.value) || 0)} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '13px 0', borderRadius: 'var(--radius-md)', cursor: 'pointer',
            border: '1px solid var(--border-medium)', background: 'transparent',
            color: 'var(--text-secondary)', fontSize: 14, fontWeight: 600,
            fontFamily: 'var(--font-body)',
          }}>
            Anuluj
          </button>
          <button
            onClick={handleSubmit}
            disabled={!valid || saving}
            style={{
              flex: 2, padding: '13px 0', borderRadius: 'var(--radius-md)',
              cursor: valid && !saving ? 'pointer' : 'not-allowed',
              border: 'none',
              background: valid && !saving ? 'var(--gradient-accent)' : 'rgba(255,255,255,0.06)',
              color: valid && !saving ? '#fff' : 'var(--text-dim)',
              fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-body)',
            }}
          >
            {saving ? 'Zapisywanie...' : isEdit ? 'Zapisz zmiany' : 'Utwórz wydarzenie'}
          </button>
        </div>
      </div>
    </div>
  );
}
