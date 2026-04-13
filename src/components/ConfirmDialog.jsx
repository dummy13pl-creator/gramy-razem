export default function ConfirmDialog({ title, message, confirmLabel = 'Potwierdź', danger = false, onConfirm, onCancel }) {
  return (
    <div
      onClick={onCancel}
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
          width: '100%', maxWidth: 420, padding: '32px 28px',
          background: 'var(--bg-surface)', border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-xl)',
        }}
      >
        <h3 style={{
          color: 'var(--text-primary)', fontSize: 18, fontWeight: 700,
          margin: '0 0 10px', fontFamily: 'var(--font-display)',
        }}>
          {title}
        </h3>
        <p style={{
          color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6, margin: '0 0 28px',
        }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: '12px 0', borderRadius: 'var(--radius-md)', cursor: 'pointer',
            border: '1px solid var(--border-medium)', background: 'transparent',
            color: 'var(--text-secondary)', fontSize: 14, fontWeight: 600,
            fontFamily: 'var(--font-body)',
          }}>
            Anuluj
          </button>
          <button onClick={onConfirm} style={{
            flex: 1, padding: '12px 0', borderRadius: 'var(--radius-md)', cursor: 'pointer',
            border: 'none',
            background: danger
              ? 'linear-gradient(135deg, var(--accent-red), #dc2626)'
              : 'var(--gradient-accent)',
            color: '#fff', fontSize: 14, fontWeight: 600,
            fontFamily: 'var(--font-body)',
          }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
