import { useEffect } from 'react';
import { CheckIcon, XIcon } from './Icons';

export default function Toast({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [toast, onDismiss]);

  if (!toast) return null;

  const colors = {
    success: { bg: '#16a34a', icon: <CheckIcon /> },
    error: { bg: '#dc2626', icon: <XIcon size={16} /> },
    info: { bg: '#2563eb', icon: null },
  };

  const c = colors[toast.type] || colors.info;

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      background: c.bg, color: '#fff', padding: '14px 22px',
      borderRadius: 'var(--radius-md)', fontSize: 14, fontWeight: 500,
      boxShadow: 'var(--shadow-lg)',
      animation: 'slideUp .3s ease-out',
      display: 'flex', alignItems: 'center', gap: 10, maxWidth: 400,
    }}>
      {c.icon}
      {toast.message}
    </div>
  );
}
