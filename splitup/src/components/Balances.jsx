import React from 'react';
import { money } from '../money.js';

/**
 * Diverging bars: money owed to a person grows right from the centre line,
 * money they owe grows left. Bar length is relative to the biggest balance.
 */
export default function Balances({ room, me }) {
  const largest = Math.max(1, ...Object.values(room.balances).map(Math.abs));
  const totalSpent = room.expenses.reduce((sum, e) => sum + e.amount, 0);
  const mine = room.balances[me.id] ?? 0;
  const headline = mine > 0 ? `You’re owed ${money(mine, room.currency)}`
    : mine < 0 ? `You owe ${money(-mine, room.currency)}`
    : 'You’re settled up';

  return (
    <>
      <p className={`you-line ${mine > 0 ? 'credit' : mine < 0 ? 'debit' : ''}`}>{headline}</p>
      <p className="muted">Group has spent {money(totalSpent, room.currency)} across {room.expenses.length} {room.expenses.length === 1 ? 'expense' : 'expenses'}.</p>
      <ul className="ledger">
        {room.members.map((m) => {
          const bal = room.balances[m.id] ?? 0;
          const width = `${(Math.abs(bal) / largest) * 50}%`;
          const text = bal > 0 ? `is owed ${money(bal, room.currency)}` : bal < 0 ? `owes ${money(-bal, room.currency)}` : 'is settled up';
          return (
            <li key={m.id} className="ledger-row">
              <p className="ledger-name">{m.name}{m.id === me.id && ' (you)'} <span className="muted">{text}</span></p>
              <div className="bar-track" role="img" aria-label={`${m.name} ${text}`}>
                <span className="bar-centre" />
                {bal !== 0 && <span className={`bar ${bal > 0 ? 'credit' : 'debit'}`} style={{ width }} />}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
