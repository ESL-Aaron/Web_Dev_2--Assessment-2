import React, { useCallback, useEffect, useState } from 'react';
import { getRoom } from '../api.js';
import ExpenseList from './ExpenseList.jsx';
import ExpenseForm from './ExpenseForm.jsx';
import Balances from './Balances.jsx';
import Settle from './Settle.jsx';

const TABS = [
  { id: 'expenses', label: 'Expenses' },
  { id: 'balances', label: 'Balances' },
  { id: 'settle', label: 'Settle up' },
];

export default function Room({ session, onLeave }) {
  const [room, setRoom] = useState(null);
  const [tab, setTab] = useState('expenses');
  const [adding, setAdding] = useState(false);
  const [copied, setCopied] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setRoom(await getRoom(session.code));
    } catch (err) {
      if (/not found/i.test(err.message)) onLeave('That room no longer exists.');
    }
  }, [session.code, onLeave]);

  // Poll so everyone in the room sees new expenses without refreshing.
  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 5000);
    return () => clearInterval(timer);
  }, [refresh]);

  if (!room) return <main className="loading">Loading trip…</main>;

  const me = room.members.find((m) => m.id === session.userId);
  if (!me) { onLeave('You are no longer in that room.'); return null; }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(room.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard blocked: the code is still visible to read out */ }
  }

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h1 className="trip-name">{room.name}</h1>
          <p className="muted">{room.members.length} {room.members.length === 1 ? 'person' : 'people'} · you are {me.name}</p>
        </div>
        <div className="topbar-actions">
          <button className="code-chip" onClick={copyCode} aria-label={`Room code ${room.code}. Copy`}>
            <span className="code-chip-label">{copied ? 'Copied' : 'Code'}</span>
            <strong>{room.code}</strong>
          </button>
          <button className="btn quiet" onClick={() => onLeave()}>Switch trip</button>
        </div>
      </header>

      <main className="layout" data-tab={tab}>
        <section className="panel panel-expenses" aria-label="Expenses">
          <div className="panel-head">
            <h2>Expenses</h2>
            <button className="btn primary add-btn" onClick={() => setAdding(true)}>Add expense</button>
          </div>
          <ExpenseList room={room} me={me} onChange={setRoom} />
        </section>

        <div className="side">
        <section className="panel panel-balances" aria-label="Balances">
          <h2>Balances</h2>
          <Balances room={room} me={me} />
        </section>

        <section className="panel panel-settle" aria-label="Settle up">
          <h2>Settle up</h2>
          <Settle room={room} me={me} onChange={setRoom} />
        </section>
        </div>
      </main>

      <nav className="tabbar" aria-label="Sections">
        {TABS.map((t) => (
          <button key={t.id} aria-current={tab === t.id ? 'page' : undefined} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </nav>

      {adding && (
        <ExpenseForm room={room} me={me} onClose={() => setAdding(false)} onSaved={(next) => { setRoom(next); setAdding(false); setTab('expenses'); }} />
      )}
    </div>
  );
}
