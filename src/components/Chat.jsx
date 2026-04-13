import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../utils/api';
import { LoaderIcon, ShieldIcon } from './Icons';

function formatTime(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  const time = d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });

  if (days === 0) {
    const today = now.toDateString() === d.toDateString();
    if (today) return `dziś ${time}`;
    return `wczoraj ${time}`;
  }
  if (days === 1) return `wczoraj ${time}`;
  if (days < 7) {
    const dayName = d.toLocaleDateString('pl-PL', { weekday: 'long' });
    return `${dayName} ${time}`;
  }
  return d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' }) + ` ${time}`;
}

function ChatBubble({ msg, isOwn, showAvatar }) {
  const isAdmin = msg.userRole === 'admin';
  const initials = (msg.userName || '?').split(' ').map(n => n[0]).join('').slice(0, 2);

  return (
    <div style={{
      display: 'flex', gap: 10, flexDirection: isOwn ? 'row-reverse' : 'row',
      alignItems: 'flex-end', marginBottom: 4,
    }}>
      {/* Awatar */}
      {showAvatar ? (
        <div style={{
          width: 34, height: 34, borderRadius: 10, flexShrink: 0,
          background: isOwn ? 'var(--gradient-accent)' : isAdmin ? 'var(--gradient-admin)' : 'var(--gradient-user)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 700, fontSize: 12,
        }}>
          {initials}
        </div>
      ) : (
        <div style={{ width: 34, flexShrink: 0 }} />
      )}

      {/* Dymek */}
      <div style={{ maxWidth: '75%', minWidth: 80 }}>
        {showAvatar && (
          <div style={{
            fontSize: 11, fontWeight: 600, marginBottom: 3,
            color: isOwn ? 'var(--accent-cyan)' : isAdmin ? '#fbbf24' : 'var(--text-secondary)',
            textAlign: isOwn ? 'right' : 'left',
            display: 'flex', alignItems: 'center', gap: 4,
            justifyContent: isOwn ? 'flex-end' : 'flex-start',
          }}>
            {isAdmin && <ShieldIcon size={10} />}
            {msg.userName}
          </div>
        )}
        <div style={{
          padding: '10px 14px',
          borderRadius: isOwn ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
          background: isOwn ? 'rgba(34,211,238,0.12)' : 'rgba(255,255,255,0.05)',
          border: isOwn ? '1px solid rgba(34,211,238,0.15)' : '1px solid var(--border-subtle)',
          color: 'var(--text-primary)', fontSize: 14, lineHeight: 1.5,
          wordBreak: 'break-word',
        }}>
          {msg.content}
        </div>
        <div style={{
          fontSize: 10, color: 'var(--text-dim)', marginTop: 3,
          textAlign: isOwn ? 'right' : 'left',
        }}>
          {formatTime(msg.createdAt)}
        </div>
      </div>
    </div>
  );
}

function DateSeparator({ date }) {
  const d = new Date(date);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const isYesterday = new Date(now - 86400000).toDateString() === d.toDateString();

  let label;
  if (isToday) label = 'Dzisiaj';
  else if (isYesterday) label = 'Wczoraj';
  else label = d.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0',
    }}>
      <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
      <span style={{ color: 'var(--text-dim)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
    </div>
  );
}

export default function Chat({ userId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const scrollToBottom = useCallback(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [autoScroll]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    setAutoScroll(scrollHeight - scrollTop - clientHeight < 80);
  };

  const fetchMessages = useCallback(async () => {
    try {
      const data = await api.getChatMessages();
      setMessages(data.messages);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Pierwsze pobranie
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Auto-odświeżanie co 5 sekund
  useEffect(() => {
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  // Scroll po nowych wiadomościach
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const content = input.trim();
    setInput('');
    setSending(true);
    try {
      const data = await api.sendChatMessage(content);
      setMessages(prev => [...prev, data.message]);
      setAutoScroll(true);
    } catch (err) {
      setInput(content); // przywróć tekst jeśli błąd
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Grupuj wiadomości — pokaż awatar tylko przy pierwszej z serii
  const renderMessages = () => {
    const elements = [];
    let lastDate = null;

    messages.forEach((msg, i) => {
      const msgDate = new Date(msg.createdAt).toDateString();
      if (msgDate !== lastDate) {
        elements.push(<DateSeparator key={`date-${msgDate}`} date={msg.createdAt} />);
        lastDate = msgDate;
      }

      const prevMsg = messages[i - 1];
      const showAvatar = !prevMsg ||
        prevMsg.userId !== msg.userId ||
        new Date(prevMsg.createdAt).toDateString() !== msgDate ||
        (new Date(msg.createdAt) - new Date(prevMsg.createdAt)) > 300000; // 5 min

      elements.push(
        <ChatBubble
          key={msg.id}
          msg={msg}
          isOwn={msg.userId === userId}
          showAvatar={showAvatar}
        />
      );
    });

    return elements;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
        <LoaderIcon size={24} />
        <p style={{ marginTop: 8, fontSize: 14 }}>Ładowanie czatu...</p>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: 'calc(100vh - 200px)', minHeight: 400, maxHeight: 700,
    }}>
      {/* Nagłówek */}
      <div style={{
        padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <span style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 600 }}>
            💬 Czat grupowy
          </span>
          <span style={{ color: 'var(--text-dim)', fontSize: 12, marginLeft: 10 }}>
            historia z ostatnich 14 dni
          </span>
        </div>
        <span style={{
          padding: '3px 8px', borderRadius: 6, fontSize: 10,
          fontWeight: 700, background: 'rgba(34,211,238,0.1)', color: 'var(--accent-cyan)',
        }}>
          {messages.length} wiadomości
        </span>
      </div>

      {/* Wiadomości */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{
          flex: 1, overflowY: 'auto', padding: '12px 18px',
        }}
      >
        {messages.length === 0 && !error && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-dim)' }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>💬</p>
            <p style={{ fontSize: 14, fontWeight: 500 }}>Brak wiadomości</p>
            <p style={{ fontSize: 12, marginTop: 4 }}>Napisz pierwszą wiadomość!</p>
          </div>
        )}

        {error && (
          <div style={{
            textAlign: 'center', padding: '16px', marginBottom: 12,
            background: 'rgba(239,68,68,0.08)', borderRadius: 12,
            border: '1px solid rgba(239,68,68,0.15)',
            color: '#f87171', fontSize: 13,
          }}>
            {error}
          </div>
        )}

        {renderMessages()}
        <div ref={messagesEndRef} />
      </div>

      {/* Pole do wpisywania */}
      <div style={{
        padding: '12px 18px', borderTop: '1px solid var(--border-subtle)',
        display: 'flex', gap: 10, alignItems: 'flex-end',
      }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Napisz wiadomość..."
          maxLength={1000}
          rows={1}
          style={{
            flex: 1, padding: '12px 14px', borderRadius: 12,
            border: '1px solid var(--border-medium)', background: 'rgba(255,255,255,0.04)',
            color: 'var(--text-primary)', fontSize: 14, fontFamily: 'var(--font-body)',
            resize: 'none', outline: 'none', minHeight: 44, maxHeight: 120,
            lineHeight: 1.4, boxSizing: 'border-box',
          }}
          onInput={(e) => {
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          style={{
            padding: '12px 20px', borderRadius: 12, border: 'none',
            background: input.trim() && !sending ? 'var(--gradient-accent)' : 'rgba(255,255,255,0.06)',
            color: input.trim() && !sending ? '#fff' : 'var(--text-dim)',
            fontSize: 14, fontWeight: 600, cursor: input.trim() && !sending ? 'pointer' : 'not-allowed',
            fontFamily: 'var(--font-body)', flexShrink: 0, height: 44,
            transition: 'all .2s',
          }}
        >
          {sending ? '...' : 'Wyślij'}
        </button>
      </div>
    </div>
  );
}
