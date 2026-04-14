import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useEvents } from '../hooks/useEvents';
import { useToast } from '../hooks/useToast';
import { api } from '../utils/api';
import Header from '../components/Header';
import EventCard from '../components/EventCard';
import EventModal from '../components/EventModal';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast from '../components/Toast';
import AdminPanel from '../components/AdminPanel';
import Chat from '../components/Chat';
import { PlusIcon, CalendarIcon, LoaderIcon } from '../components/Icons';

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const {
    events, loading, error, fetchEvents,
    createEvent, updateEvent, deleteEvent,
    registerForEvent, unregisterFromEvent,
  } = useEvents();
  const { toast, notify, dismiss } = useToast();

  const [showModal, setShowModal] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [filter, setFilter] = useState('all');
  const [saving, setSaving] = useState(false);
  const [pageTab, setPageTab] = useState('events'); // 'events' | 'chat' | 'admin'
  const [unreadChat, setUnreadChat] = useState(0);
  const lastSeenChatId = useRef(0);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // ── Śledzenie nieprzeczytanych wiadomości na czacie ────────────────────────
  // Zapisz ostatnią widzianą wiadomość gdy użytkownik jest na zakładce czatu
  const handleSetPageTab = useCallback((tab) => {
    if (tab === 'chat') {
      setUnreadChat(0);
    }
    setPageTab(tab);
  }, []);

  // Pobieraj liczbę nowych wiadomości w tle co 5s
  useEffect(() => {
    let mounted = true;

    const checkNewMessages = async () => {
      try {
        const data = await api.getChatMessages();
        if (!mounted) return;
        const msgs = data.messages || [];
        if (msgs.length > 0) {
          const latestId = Math.max(...msgs.map(m => m.id));
          // Przy pierwszym załadowaniu ustaw lastSeen bez pokazywania badge'a
          if (lastSeenChatId.current === 0) {
            lastSeenChatId.current = latestId;
          } else if (pageTab === 'chat') {
            // Użytkownik jest na czacie — aktualizuj lastSeen
            lastSeenChatId.current = latestId;
            setUnreadChat(0);
          } else {
            // Użytkownik nie jest na czacie — policz nowe
            const newCount = msgs.filter(m => m.id > lastSeenChatId.current && m.userId !== user.id).length;
            setUnreadChat(newCount);
          }
        }
      } catch {
        // cicho ignoruj błędy pollingu
      }
    };

    checkNewMessages();
    const interval = setInterval(checkNewMessages, 5000);
    return () => { mounted = false; clearInterval(interval); };
  }, [pageTab, user.id]);

  // Gdy użytkownik przechodzi na czat — wyzeruj badge i zapamiętaj lastSeen
  useEffect(() => {
    if (pageTab === 'chat') {
      setUnreadChat(0);
    }
  }, [pageTab]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleRegister = useCallback(async (eventId) => {
    try {
      await registerForEvent(eventId);
      notify('Zapisano na wydarzenie!');
    } catch (err) {
      notify(err.message, 'error');
    }
  }, [registerForEvent, notify]);

  const handleUnregister = useCallback((eventId) => {
    setConfirm({
      title: 'Wypisz się z wydarzenia',
      message: 'Czy na pewno chcesz wypisać się? Twoje miejsce zostanie zwolnione.',
      confirmLabel: 'Wypisz się',
      danger: true,
      action: async () => {
        try {
          await unregisterFromEvent(eventId);
          notify('Wypisano z wydarzenia');
        } catch (err) {
          notify(err.message, 'error');
        }
        setConfirm(null);
      },
    });
  }, [unregisterFromEvent, notify]);

  const handleSaveEvent = useCallback(async (formData) => {
    setSaving(true);
    try {
      if (editEvent) {
        await updateEvent(editEvent.id, formData);
        notify('Wydarzenie zaktualizowane');
      } else {
        await createEvent(formData);
        notify('Wydarzenie utworzone!');
      }
      setShowModal(false);
      setEditEvent(null);
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }, [editEvent, createEvent, updateEvent, notify]);

  const handleDeleteEvent = useCallback((eventId) => {
    setConfirm({
      title: 'Usuń wydarzenie',
      message: 'Czy na pewno chcesz usunąć to wydarzenie? Wszystkie zapisy zostaną utracone.',
      confirmLabel: 'Usuń',
      danger: true,
      action: async () => {
        try {
          await deleteEvent(eventId);
          notify('Wydarzenie usunięte');
        } catch (err) {
          notify(err.message, 'error');
        }
        setConfirm(null);
      },
    });
  }, [deleteEvent, notify]);

  const handleEdit = useCallback((ev) => {
    setEditEvent(ev);
    setShowModal(true);
  }, []);

  // ── Filter & stats ─────────────────────────────────────────────────────────
  const now = new Date();
  const filtered = events.filter((ev) => {
    const evDate = new Date(ev.date + 'T' + ev.time);
    if (filter === 'upcoming') return evDate >= now;
    if (filter === 'my') return ev.registrations.some((r) => r.userId === user.id);
    return true;
  });

  const stats = {
    total: events.length,
    upcoming: events.filter((ev) => new Date(ev.date + 'T' + ev.time) >= now).length,
    myEvents: events.filter((ev) => ev.registrations.some((r) => r.userId === user.id)).length,
    totalSpots: events.reduce((s, e) => s + e.capacity, 0),
  };

  const filterBtnStyle = (active) => ({
    padding: '8px 16px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
    fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)',
    border: active ? '1px solid var(--border-accent)' : '1px solid var(--border-subtle)',
    background: active ? 'rgba(34,211,238,0.1)' : 'transparent',
    color: active ? 'var(--accent-cyan)' : 'var(--text-muted)',
    transition: 'all .2s',
  });

  return (
    <div style={{ minHeight: '100vh' }}>
      <Header />

      <main style={{ maxWidth: 960, margin: '0 auto', padding: '28px 24px 60px' }}>
        {/* Główne zakładki */}
        <div style={{
          display: 'flex', gap: 4, marginBottom: 24, padding: 4,
          background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)', maxWidth: isAdmin ? 480 : 320,
        }}>
          {[
            { id: 'events', label: '🏟️ Wydarzenia' },
            { id: 'chat', label: '💬 Czat' },
            ...(isAdmin ? [{ id: 'admin', label: '🛡️ Admin' }] : []),
          ].map((t) => (
            <button key={t.id} onClick={() => handleSetPageTab(t.id)} style={{
              flex: 1, padding: '10px 0', borderRadius: 'var(--radius-sm)',
              border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
              fontFamily: 'var(--font-body)', transition: 'all .2s',
              background: pageTab === t.id
                ? t.id === 'admin' ? 'rgba(245,158,11,0.12)' : 'rgba(34,211,238,0.12)'
                : t.id === 'chat' && unreadChat > 0
                  ? 'rgba(34,211,238,0.06)'
                  : 'transparent',
              color: pageTab === t.id
                ? t.id === 'admin' ? '#fbbf24' : 'var(--accent-cyan)'
                : t.id === 'chat' && unreadChat > 0
                  ? 'var(--accent-cyan)'
                  : 'var(--text-muted)',
              position: 'relative',
            }}>
              {t.label}
              {t.id === 'chat' && unreadChat > 0 && pageTab !== 'chat' && (
                <span style={{
                  position: 'absolute', top: 4, right: 8,
                  minWidth: 18, height: 18, borderRadius: 9,
                  background: 'var(--accent-red)', color: '#fff',
                  fontSize: 10, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 5px', lineHeight: 1,
                  animation: 'fadeIn .3s ease-out',
                  boxShadow: '0 2px 8px rgba(239,68,68,0.4)',
                }}>
                  {unreadChat > 99 ? '99+' : unreadChat}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── CZAT ──────────────────────────────────────────────────────────── */}
        {pageTab === 'chat' && (
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
            borderRadius: 18, overflow: 'hidden',
          }}>
            <Chat userId={user.id} />
          </div>
        )}

        {/* ── PANEL ADMINISTRACYJNY ─────────────────────────────────────────── */}
        {pageTab === 'admin' && isAdmin && (
          <AdminPanel notify={notify} currentUserId={user.id} />
        )}

        {/* ── WYDARZENIA ────────────────────────────────────────────────────── */}
        {pageTab === 'events' && (<>
        {/* Stats */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 12, marginBottom: 28,
        }}>
          {[
            { label: 'Wszystkie', value: stats.total, color: 'var(--text-muted)' },
            { label: 'Nadchodzące', value: stats.upcoming, color: 'var(--accent-cyan)' },
            { label: 'Moje zapisy', value: stats.myEvents, color: '#a78bfa' },
            { label: 'Łączna poj.', value: stats.totalSpots, color: 'var(--accent-green)' },
          ].map((s) => (
            <div key={s.label} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
              borderRadius: 14, padding: '16px 18px',
            }}>
              <div style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {s.label}
              </div>
              <div style={{ color: s.color, fontSize: 28, fontWeight: 800, marginTop: 4, fontFamily: 'var(--font-display)' }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 12, marginBottom: 22,
        }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => setFilter('all')} style={filterBtnStyle(filter === 'all')}>Wszystkie</button>
            <button onClick={() => setFilter('upcoming')} style={filterBtnStyle(filter === 'upcoming')}>Nadchodzące</button>
            <button onClick={() => setFilter('my')} style={filterBtnStyle(filter === 'my')}>Moje zapisy</button>
          </div>

          {isAdmin && (
            <button
              onClick={() => { setEditEvent(null); setShowModal(true); }}
              style={{
                padding: '10px 20px', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer',
                background: 'var(--gradient-accent)',
                color: '#fff', fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-body)',
                display: 'flex', alignItems: 'center', gap: 8,
                boxShadow: 'var(--shadow-glow)',
              }}
            >
              <PlusIcon /> Nowe wydarzenie
            </button>
          )}
        </div>

        {/* Loading state */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <LoaderIcon size={32} />
            <p style={{ marginTop: 12, fontSize: 15 }}>Ładowanie wydarzeń...</p>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div style={{
            textAlign: 'center', padding: '40px 20px', color: 'var(--accent-red)',
            background: 'rgba(239,68,68,0.05)', borderRadius: 18,
            border: '1px solid rgba(239,68,68,0.15)',
          }}>
            <p style={{ fontSize: 15, fontWeight: 600 }}>Błąd: {error}</p>
            <button
              onClick={fetchEvents}
              style={{
                marginTop: 12, padding: '8px 20px', borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(239,68,68,0.3)', background: 'transparent',
                color: '#f87171', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'var(--font-body)',
              }}
            >
              Spróbuj ponownie
            </button>
          </div>
        )}

        {/* Events list */}
        {!loading && !error && (
          <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filtered.length === 0 && (
              <div style={{
                textAlign: 'center', padding: '60px 20px', color: 'var(--text-dim)',
                background: 'rgba(255,255,255,0.02)', borderRadius: 18,
                border: '1px solid rgba(255,255,255,0.04)',
              }}>
                <CalendarIcon size={32} />
                <p style={{ marginTop: 12, fontSize: 15, fontWeight: 500 }}>
                  Brak wydarzeń do wyświetlenia
                </p>
                <p style={{ fontSize: 13, marginTop: 4 }}>
                  {filter !== 'all' ? 'Spróbuj zmienić filtr' : isAdmin ? 'Utwórz nowe wydarzenie' : 'Poczekaj na nowe terminy'}
                </p>
              </div>
            )}

            {filtered.map((ev) => (
              <EventCard
                key={ev.id}
                event={ev}
                userId={user.id}
                isAdmin={isAdmin}
                onRegister={handleRegister}
                onUnregister={handleUnregister}
                onEdit={handleEdit}
                onDelete={handleDeleteEvent}
              />
            ))}
          </div>
        )}
        </>)}
      </main>

      {/* Modals */}
      {showModal && (
        <EventModal
          event={editEvent}
          saving={saving}
          onSave={handleSaveEvent}
          onClose={() => { setShowModal(false); setEditEvent(null); }}
        />
      )}

      {confirm && (
        <ConfirmDialog
          title={confirm.title}
          message={confirm.message}
          confirmLabel={confirm.confirmLabel}
          danger={confirm.danger}
          onConfirm={confirm.action}
          onCancel={() => setConfirm(null)}
        />
      )}

      <Toast toast={toast} onDismiss={dismiss} />
    </div>
  );
}
