import React, { useState } from 'react';
import { recordPayment, saveBank } from '../api.js';
import { money } from '../money.js';

export default function Settle({ room, me, onChange }) {
  const [bank, setBank] = useState(me.bank);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const nameOf = (id) => room.members.find((m) => m.id === id);

  async function copy(text) {
    try { await navigator.clipboard.writeText(text); setStatus('Copied to clipboard.'); }
    catch { setStatus('Copy blocked by your browser. Select the text instead.'); }
  }

  async function markPaid(t) {
    setError('');
    try { onChange(await recordPayment(room.code, t)); setStatus('Payment recorded.'); }
    catch (err) { setError(err.message); }
  }

  async function submitBank(e) {
    e.preventDefault();
    setError('');
    try { onChange(await saveBank(room.code, me.id, bank)); setStatus('Payment details saved.'); }
    catch (err) { setError(err.message); }
  }

  const isMine = (t) => t.from === me.id || t.to === me.id;
  const mine = room.transfers.filter(isMine);
  const others = room.transfers.filter((t) => !isMine(t));

  function renderTransfer(t) {
    const to = nameOf(t.to);
    const iPay = t.from === me.id;
    return (
      <li key={`${t.from}-${t.to}`} className="transfer">
        <p className="transfer-line">
          <strong>{iPay ? 'You' : nameOf(t.from).name}</strong> pay{iPay ? '' : 's'} <strong>{t.to === me.id ? 'you' : to.name}</strong>
          <span className="transfer-amount">{money(t.amount, room.currency)}</span>
        </p>
        {to.bank
          ? <p className="muted">Send to: {to.bank} <button className="link-btn" onClick={() => copy(to.bank)}>Copy</button></p>
          : <p className="muted">{to.name} hasn’t added payment details yet.</p>}
        {isMine(t) && (
          <button className="btn" onClick={() => markPaid(t)}>{iPay ? 'I’ve paid this' : 'Mark as received'}</button>
        )}
      </li>
    );
  }

  return (
    <>
      <form className="bank-form" onSubmit={submitBank}>
        <label>Where should people pay you?
          <textarea value={bank} onChange={(e) => setBank(e.target.value)} rows={2} maxLength={300} placeholder="Sort code 00-00-00, account 12345678" />
        </label>
        <button className="btn">Save details</button>
      </form>

      <h3>Your payments</h3>
      {room.transfers.length === 0 ? (
        <p className="empty">Everyone is settled up.</p>
      ) : mine.length === 0 ? (
        <p className="empty">You don’t owe anyone and no one owes you.</p>
      ) : (
        <ul className="transfers">{mine.map(renderTransfer)}</ul>
      )}

      {others.length > 0 && (
        <>
          <h3>Between everyone else</h3>
          <ul className="transfers">{others.map(renderTransfer)}</ul>
        </>
      )}

      {room.settlements.length > 0 && (
        <>
          <h3>Payments made</h3>
          <ul className="history">
            {room.settlements.map((s) => (
              <li key={s.id} className="muted">{nameOf(s.from).name} paid {nameOf(s.to).name} {money(s.amount, room.currency)}</li>
            ))}
          </ul>
        </>
      )}

      <p className="muted status" role="status">{status}</p>
      {error && <p className="error" role="alert">{error}</p>}
    </>
  );
}
