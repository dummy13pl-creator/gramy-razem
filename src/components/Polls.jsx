import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';
import { LoaderIcon, PlusIcon, TrashIcon, CheckIcon, XIcon } from './Icons';

function ConfirmInline({ message, onConfirm, onCancel, danger = true }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 12px', borderRadius: 10,
      background: danger ? 'rgba(239,68,68,0.08)' : 'rgba(34,211,238,0.08)',
      border: `1px solid ${danger ? 'rgba(239,68,68,0.2)' : 'rgba(34,211,238,0.2)'}`,
    }}>
      <span style={{ color: 'var(--text-secondary)', fontSize: 12, flex: 1 }}>{message}</span>
      <button onClick={onCancel} style={{
        padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border-subtle)',
        background: 'transparent', color: 'var(--text-muted)', fontSize: 11,
        fontWeight: 600, cursor: 'pointer',
      }}>Nie</button>
      <button onClick={onConfirm} style={{
        padding: '4px 10px', borderRadius: 6, border: 'none',
        background: danger ? 'var(--accent-red)' : 'var(--accent-cyan)',
        color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer',
      }}>Tak</button>
    </div>
  );
}

function PollCard({ poll, isAdmin, currentUserId, onVote, onUnvote, onDelete, notify }) {
  const [showStats, setShowStats] = useState(false);
  const [voting, setVoting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const userVoted = poll.userVotedOptionId !== null;
  const totalVotes = poll.totalVotes;

  const handleVote = async (optionId) => {
    setVoting(true);
    try {
      await onVote(poll.id, optionId);
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setVoting(false);
    }
  };

  const handleUnvote = async () => {
    setVoting(true);
    try {
      await onUnvote(poll.id);
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setVoting(false);
    }
  };

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
      borderRadius: 18, padding: 22, marginBottom: 12,
    }}>
      {/* Nagłówek */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        gap: 10, marginBottom: 16,
      }}>
        <div style={{ flex: 1 }}>
          <h3 style={{
            color: 'var(--text-primary)', fontSize: 17, fontWeight: 700, margin: 0,
            fontFamily: 'var(--font-display)',
          }}>
            {poll.question}
          </h3>
          <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>
            {poll.createdByName} · {new Date(poll.created_at).toLocaleDateString('pl-PL')}
            <span style={{ margin: '0 6px', opacity: 0.4 }}>·</span>
            {totalVotes} {totalVotes === 1 ? 'głos' : totalVotes < 5 ? 'głosy' : 'głosów'}
          </div>
        </div>

        {isAdmin && (
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <button
              onClick={() => setShowStats(!showStats)}
              style={{
                padding: '6px 12px', borderRadius: 8,
                border: '1px solid rgba(245,158,11,0.2)',
                background: showStats ? 'rgba(245,158,11,0.1)' : 'rgba(245,158,11,0.04)',
                color: '#fbbf24', fontSize: 11, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'var(--font-body)',
              }}
            >
              📊 Statystyki
            </button>
            {confirmDelete ? (
              <ConfirmInline
                message="Usunąć?"
                onConfirm={() => { onDelete(poll.id); setConfirmDelete(false); }}
                onCancel={() => setConfirmDelete(false)}
              />
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                title="Usuń ankietę"
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

      {/* Opcje */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {poll.options.map((opt) => {
          const isSelected = poll.userVotedOptionId === opt.id;
          const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
          const showResults = userVoted || isAdmin;

          return (
            <div key={opt.id}>
              <button
                onClick={() => !voting && !isSelected && handleVote(opt.id)}
                disabled={voting || isSelected}
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: 12,
                  border: isSelected
                    ? '2px solid var(--accent-cyan)'
                    : '1px solid var(--border-subtle)',
                  background: isSelected ? 'rgba(34,211,238,0.08)' : 'rgba(255,255,255,0.02)',
                  color: 'var(--text-primary)', fontSize: 14, fontWeight: 500,
                  cursor: voting || isSelected ? 'default' : 'pointer',
                  fontFamily: 'var(--font-body)', textAlign: 'left',
                  position: 'relative', overflow: 'hidden',
                  transition: 'all .2s',
                }}
              >
                {/* Pasek procentowy */}
                {showResults && (
                  <div style={{
                    position: 'absolute', top: 0, left: 0, bottom: 0,
                    width: `${pct}%`,
                    background: isSelected
                      ? 'rgba(34,211,238,0.12)'
                      : 'rgba(255,255,255,0.04)',
                    transition: 'width .5s ease',
                    pointerEvents: 'none',
                  }} />
                )}
                <div style={{
                  position: 'relative',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {isSelected && <CheckIcon size={14} />}
                    {opt.content}
                  </span>
                  {showResults && (
                    <span style={{
                      fontSize: 12, fontWeight: 700,
                      color: isSelected ? 'var(--accent-cyan)' : 'var(--text-muted)',
                    }}>
                      {pct}% ({opt.votes})
                    </span>
                  )}
                </div>
              </button>

              {/* Lista głosujących — tylko dla admina */}
              {isAdmin && showStats && poll.voters?.[opt.id] && poll.voters[opt.id].length > 0 && (
                <div style={{
                  marginTop: 4, marginLeft: 16, padding: '8px 12px',
                  background: 'rgba(245,158,11,0.04)', borderRadius: 8,
                  border: '1px solid rgba(245,158,11,0.1)',
                }}>
                  <div style={{ color: '#fbbf24', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                    Głosowali ({poll.voters[opt.id].length}):
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {poll.voters[opt.id].map(v => (
                      <span key={v.userId} style={{
                        padding: '2px 8px', borderRadius: 6, fontSize: 11,
                        background: v.userId === currentUserId ? 'rgba(34,211,238,0.1)' : 'rgba(255,255,255,0.04)',
                        color: v.userId === currentUserId ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                      }}>
                        {v.userName}{v.userId === currentUserId ? ' (Ty)' : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Cofnij głos */}
      {userVoted && !voting && (
        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleUnvote}
            style={{
              padding: '6px 12px', borderRadius: 8,
              border: '1px solid var(--border-subtle)', background: 'transparent',
              color: 'var(--text-muted)', fontSize: 12, fontWeight: 500,
              cursor: 'pointer', fontFamily: 'var(--font-body)',
              display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            <XIcon size={12} /> Cofnij głos
          </button>
        </div>
      )}
    </div>
  );
}

function CreatePollForm({ onCreate, onCancel, creating }) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);

  const addOption = () => {
    if (options.length < 10) setOptions([...options, '']);
  };
  const removeOption = (i) => {
    if (options.length > 2) setOptions(options.filter((_, idx) => idx !== i));
  };
  const updateOption = (i, val) => {
    const next = [...options];
    next[i] = val;
    setOptions(next);
  };

  const cleaned = options.map(o => o.trim()).filter(Boolean);
  const canSubmit = question.trim().length >= 3 && cleaned.length >= 2;

  const inputStyle = {
    width: '100%', padding: '11px 14px', borderRadius: 10,
    border: '1px solid var(--border-medium)', background: 'rgba(255,255,255,0.04)',
    color: 'var(--text-primary)', fontSize: 14, fontFamily: 'var(--font-body)',
    boxSizing: 'border-box',
  };

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid rgba(245,158,11,0.2)',
      borderRadius: 18, padding: 24, marginBottom: 16,
    }}>
      <h3 style={{
        color: '#fbbf24', fontSize: 16, fontWeight: 700, margin: '0 0 16px',
        fontFamily: 'var(--font-display)',
      }}>
        📝 Nowa ankieta
      </h3>

      <label style={{
        display: 'block', color: 'var(--text-secondary)', fontSize: 11,
        fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8,
      }}>
        Treść pytania
      </label>
      <input
        style={inputStyle} value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="np. Na którą godzinę najlepiej pasuje trening?"
      />

      <label style={{
        display: 'block', color: 'var(--text-secondary)', fontSize: 11,
        fontWeight: 600, marginBottom: 6, marginTop: 16,
        textTransform: 'uppercase', letterSpacing: 0.8,
      }}>
        Opcje odpowiedzi ({options.length}/10)
      </label>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {options.map((opt, i) => (
          <div key={i} style={{ display: 'flex', gap: 8 }}>
            <input
              style={{ ...inputStyle, flex: 1 }}
              value={opt}
              onChange={(e) => updateOption(i, e.target.value)}
              placeholder={`Opcja ${i + 1}`}
            />
            {options.length > 2 && (
              <button
                onClick={() => removeOption(i)}
                title="Usuń opcję"
                style={{
                  padding: '0 12px', borderRadius: 10,
                  border: '1px solid rgba(239,68,68,0.15)',
                  background: 'rgba(239,68,68,0.05)',
                  color: '#f87171', cursor: 'pointer',
                  display: 'flex', alignItems: 'center',
                }}
              >
                <TrashIcon size={14} />
              </button>
            )}
          </div>
        ))}
      </div>

      {options.length < 10 && (
        <button
          onClick={addOption}
          style={{
            marginTop: 10, padding: '8px 14px', borderRadius: 10,
            border: '1px dashed var(--border-medium)', background: 'transparent',
            color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500,
            cursor: 'pointer', fontFamily: 'var(--font-body)',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          <PlusIcon size={14} /> Dodaj opcję
        </button>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        <button
          onClick={onCancel}
          style={{
            flex: 1, padding: '11px 0', borderRadius: 10, cursor: 'pointer',
            border: '1px solid var(--border-medium)', background: 'transparent',
            color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600,
            fontFamily: 'var(--font-body)',
          }}
        >
          Anuluj
        </button>
        <button
          onClick={() => onCreate(question, cleaned)}
          disabled={!canSubmit || creating}
          style={{
            flex: 2, padding: '11px 0', borderRadius: 10,
            cursor: canSubmit && !creating ? 'pointer' : 'not-allowed',
            border: 'none',
            background: canSubmit && !creating
              ? 'linear-gradient(135deg, #fbbf24, #f59e0b)'
              : 'rgba(255,255,255,0.06)',
            color: canSubmit && !creating ? '#fff' : 'var(--text-dim)',
            fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)',
          }}
        >
          {creating ? 'Tworzenie...' : 'Utwórz ankietę'}
        </button>
      </div>
    </div>
  );
}

export default function Polls({ isAdmin, currentUserId, notify }) {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  const fetchPolls = useCallback(async () => {
    try {
      const data = await api.getPolls();
      setPolls(data.polls);
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    fetchPolls();
  }, [fetchPolls]);

  const handleCreate = async (question, options) => {
    setCreating(true);
    try {
      const data = await api.createPoll(question, options);
      setPolls(prev => [data.poll, ...prev]);
      notify('Ankieta utworzona');
      setShowCreate(false);
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deletePoll(id);
      setPolls(prev => prev.filter(p => p.id !== id));
      notify('Ankieta usunięta');
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleVote = async (pollId, optionId) => {
    await api.votePoll(pollId, optionId);
    await fetchPolls();
    notify('Głos zapisany');
  };

  const handleUnvote = async (pollId) => {
    await api.unvotePoll(pollId);
    await fetchPolls();
    notify('Głos cofnięty');
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
        <LoaderIcon size={24} />
        <p style={{ marginTop: 8, fontSize: 14 }}>Ładowanie ankiet...</p>
      </div>
    );
  }

  return (
    <div>
      {isAdmin && !showCreate && (
        <div style={{ marginBottom: 16 }}>
          <button
            onClick={() => setShowCreate(true)}
            style={{
              padding: '10px 20px', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
              color: '#fff', fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-body)',
              display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: '0 4px 16px rgba(245,158,11,0.25)',
            }}
          >
            <PlusIcon size={16} /> Nowa ankieta
          </button>
        </div>
      )}

      {showCreate && (
        <CreatePollForm
          onCreate={handleCreate}
          onCancel={() => setShowCreate(false)}
          creating={creating}
        />
      )}

      {polls.length === 0 && !showCreate && (
        <div style={{
          textAlign: 'center', padding: '60px 20px', color: 'var(--text-dim)',
          background: 'rgba(255,255,255,0.02)', borderRadius: 18,
          border: '1px solid rgba(255,255,255,0.04)',
        }}>
          <p style={{ fontSize: 32, marginBottom: 8 }}>📊</p>
          <p style={{ fontSize: 15, fontWeight: 500 }}>Brak ankiet</p>
          <p style={{ fontSize: 13, marginTop: 4 }}>
            {isAdmin ? 'Utwórz pierwszą ankietę' : 'Poczekaj na pierwszą ankietę'}
          </p>
        </div>
      )}

      {polls.map(poll => (
        <PollCard
          key={poll.id}
          poll={poll}
          isAdmin={isAdmin}
          currentUserId={currentUserId}
          onVote={handleVote}
          onUnvote={handleUnvote}
          onDelete={handleDelete}
          notify={notify}
        />
      ))}
    </div>
  );
}
