// Pure money logic. All amounts are integer pence so we never hit floating point errors.

/** Split `amount` pence across `ids` as evenly as possible; leftover pence go to the first ids. */
export function splitEvenly(amount, ids) {
  const sorted = [...ids].sort();
  const base = Math.floor(amount / sorted.length);
  let remainder = amount - base * sorted.length;
  const shares = {};
  for (const id of sorted) {
    shares[id] = base + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder -= 1;
  }
  return shares;
}

/**
 * Net balance per member in pence.
 * Positive = the group owes them. Negative = they owe the group.
 * Recorded settlements count as money moved from -> to.
 */
export function computeBalances(memberIds, expenses, settlements = []) {
  const balances = Object.fromEntries(memberIds.map((id) => [id, 0]));
  for (const e of expenses) {
    balances[e.payerId] += e.amount;
    const shares = splitEvenly(e.amount, e.splitBetween);
    for (const [id, share] of Object.entries(shares)) balances[id] -= share;
  }
  for (const s of settlements) {
    balances[s.from] += s.amount;
    balances[s.to] -= s.amount;
  }
  return balances;
}

/**
 * Settlement simplification: repeatedly match the biggest debtor with the biggest
 * creditor. Produces at most (people - 1) transfers.
 */
export function simplifyDebts(balances) {
  const creditors = [];
  const debtors = [];
  for (const [id, amount] of Object.entries(balances)) {
    if (amount > 0) creditors.push({ id, amount });
    if (amount < 0) debtors.push({ id, amount: -amount });
  }
  const transfers = [];
  while (creditors.length && debtors.length) {
    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);
    const c = creditors[0];
    const d = debtors[0];
    const amount = Math.min(c.amount, d.amount);
    transfers.push({ from: d.id, to: c.id, amount });
    c.amount -= amount;
    d.amount -= amount;
    if (c.amount === 0) creditors.shift();
    if (d.amount === 0) debtors.shift();
  }
  return transfers;
}
