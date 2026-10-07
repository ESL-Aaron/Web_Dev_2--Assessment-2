import React, { useState } from 'react';
import { deleteExpense } from '../api.js';
import { money, dayLabel } from '../money.js';

export default function ExpenseList({ room, me, onChange }) {
  const [error, setError] = useState('');
  const nameOf = (id) => room.members.find((m) => m.id === id)?.name ?? 'Someone';

  async function remove(expense) {
    if (!window.confirm(`Delete "${expense.title}" (${money(expense.amount, room.currency)})?`)) return;
    try { onChange(await deleteExpense(room.code, expense.id)); } catch (err) { setError(err.message); }
  }

  if (!room.expenses.length) {
    return <p className="empty">No expenses yet. Add the first one, even small things like parking or tips.</p>;
  }

  return (
    <>
      {error && <p className="error" role="alert">{error}</p>}
      <ul className="expense-list">
        {room.expenses.map((e) => {
          const everyone = e.splitBetween.length === room.members.length;
          return (
            <li key={e.id} className="expense">
              <div className="expense-main">
                <p className="expense-title">{e.title}</p>
                <p className="muted">
                  {nameOf(e.payerId)} paid · {everyone ? 'split with everyone' : e.splitBetween.length === 1 ? `for ${nameOf(e.splitBetween[0])} only` : `split ${e.splitBetween.length} ways`} · {e.category} · {dayLabel(e.createdAt)}
                </p>
                <div className="expense-actions">
                  {e.receiptUrl && <a href={e.receiptUrl} target="_blank" rel="noreferrer">View receipt</a>}
                  {e.payerId === me.id && <button className="link-btn danger" onClick={() => remove(e)}>Delete</button>}
                </div>
              </div>
              {e.receiptUrl && <img className="thumb" src={e.receiptUrl} alt={`Receipt for ${e.title}`} loading="lazy" />}
              <p className="expense-amount">{money(e.amount, room.currency)}</p>
            </li>
          );
        })}
      </ul>
    </>
  );
}
