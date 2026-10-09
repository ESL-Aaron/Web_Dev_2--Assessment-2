import React, { useEffect, useMemo, useRef, useState } from 'react';
import { addExpense } from '../api.js';
import { currencySymbol } from '../money.js';

const CATEGORIES = ['Food', 'Transport', 'Stay', 'Activities', 'Tips', 'Other'];

export default function ExpenseForm({ room, me, onClose, onSaved }) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [payerId, setPayerId] = useState(me.id);
  const [splitBetween, setSplitBetween] = useState(room.members.map((m) => m.id));
  const [category, setCategory] = useState('Food');
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const firstField = useRef(null);

  const preview = useMemo(() => (photo ? URL.createObjectURL(photo) : null), [photo]);
  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  // Focus the first field and let Escape close the sheet.
  useEffect(() => {
    firstField.current?.focus();
  }, []);
 
  // Escape closes the sheet. A ref holds the latest onClose so the listener is added only once.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onCloseRef.current();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const toggle = (id) =>
    setSplitBetween((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const form = new FormData();
    form.append('title', title);
    form.append('amount', amount);
    form.append('payerId', payerId);
    form.append('splitBetween', JSON.stringify(splitBetween));
    form.append('category', category);
    if (photo) form.append('receipt', photo);
    try {
      onSaved(await addExpense(room.code, form));
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  const perPerson = Number(amount) > 0 && splitBetween.length ? (Number(amount) / splitBetween.length).toFixed(2) : null;

  return (
    <div className="sheet-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="sheet" onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="add-title">
        <div className="sheet-head">
          <h2 id="add-title">Add expense</h2>
          <button type="button" className="btn quiet" onClick={onClose}>Cancel</button>
        </div>

        <div className="row">
          <label className="grow">What for
            <input ref={firstField} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Taxi to the hotel" maxLength={60} required />
          </label>
          <label className="amount-field">Amount ({currencySymbol(room.currency)})
            <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="0.00" required />
          </label>
        </div>

        <div className="row">
          <label className="grow">Paid by
            <select value={payerId} onChange={(e) => setPayerId(e.target.value)}>
              {room.members.map((m) => <option key={m.id} value={m.id}>{m.name}{m.id === me.id ? ' (you)' : ''}</option>)}
            </select>
          </label>
          <label className="grow">Category
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
        </div>

        <fieldset>
          <legend>Split between {perPerson && <span className="muted">· {currencySymbol(room.currency)}{perPerson} each</span>}</legend>
          <div className="chips">
            {room.members.map((m) => (
              <label key={m.id} className={`chip ${splitBetween.includes(m.id) ? 'on' : ''}`}>
                <input type="checkbox" checked={splitBetween.includes(m.id)} onChange={() => toggle(m.id)} />
                {m.name}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="photo-field">Receipt photo (optional)
          <input type="file" accept="image/*" capture="environment" onChange={(e) => setPhoto(e.target.files[0] ?? null)} />
        </label>
        {preview && <img className="photo-preview" src={preview} alt="Selected receipt preview" />}

        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn primary" disabled={busy}>{busy ? 'Saving…' : 'Save expense'}</button>
      </form>
    </div>
  );
}
