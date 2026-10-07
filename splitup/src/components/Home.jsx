import React, { useState } from 'react';
import { createRoom, joinRoom } from '../api.js';
import { CURRENCIES, currencySymbol } from '../money.js';

export default function Home({ onEnter, notice }) {
  const [mode, setMode] = useState('create');
  const [tripName, setTripName] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('GBP');
  const [nameTaken, setNameTaken] = useState(false); // same name already in the room: offer to rejoin
  const [error, setError] = useState(notice);
  const [busy, setBusy] = useState(false);

  async function submit(e, rejoin = false) {
    e?.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (mode === 'create') {
        const { room, userId } = await createRoom(tripName, name, currency);
        onEnter({ code: room.code, userId });
      } else {
        const { room, userId } = await joinRoom(code.trim().toUpperCase(), name, rejoin);
        onEnter({ code: room.code, userId });
      }
    } catch (err) {
      if (err.code === 'NAME_TAKEN') setNameTaken(true);
      else setError(err.message);
      setBusy(false);
    }
  }

  return (
    <main className="home">
      <section className="home-intro">
        <h1>SplitUp</h1>
        <p className="lead">Log what each person paid on the trip, snap the receipt, and see exactly who owes who.</p>
        <ul className="home-points">
          <li>Everyone joins with a six-letter code</li>
          <li>Add an expense in under half a minute</li>
          <li>Settle up with the fewest possible payments</li>
        </ul>
      </section>

      <form className="card home-form" onSubmit={submit}>
        <div className="segmented" role="tablist" aria-label="Create or join">
          <button type="button" role="tab" aria-selected={mode === 'create'} onClick={() => { setMode('create'); setNameTaken(false); }}>New trip</button>
          <button type="button" role="tab" aria-selected={mode === 'join'} onClick={() => setMode('join')}>Join with code</button>
        </div>

        {mode === 'create' ? (
          <>
            <label>Trip name
              <input value={tripName} onChange={(e) => setTripName(e.target.value)} placeholder="Lisbon long weekend" maxLength={40} required />
            </label>
            <label>Currency
              <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                {CURRENCIES.map((c) => <option key={c} value={c}>{c} ({currencySymbol(c)})</option>)}
              </select>
            </label>
          </>
        ) : (
          <label>Room code
            <input className="code-input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="K7QM2X" maxLength={6} autoCapitalize="characters" autoComplete="off" required />
          </label>
        )}

        <label>Your name
          <input value={name} onChange={(e) => { setName(e.target.value); setNameTaken(false); }} placeholder="Aaron" maxLength={30} autoComplete="given-name" required />
        </label>

        {nameTaken && (
          <div className="rejoin" role="alert">
            <p><strong>{name.trim()}</strong> is already in this trip. Is that you?</p>
            <div className="rejoin-actions">
              <button type="button" className="btn primary" onClick={() => submit(null, true)} disabled={busy}>Yes, continue as {name.trim()}</button>
              <button type="button" className="btn" onClick={() => { setNameTaken(false); setName(''); }}>No, use a different name</button>
            </div>
          </div>
        )}
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn primary" disabled={busy || nameTaken}>{busy ? 'One moment…' : mode === 'create' ? 'Create trip' : 'Join trip'}</button>
      </form>
    </main>
  );
}
