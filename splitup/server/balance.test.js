import test from 'node:test';
import assert from 'node:assert/strict';
import { splitEvenly, computeBalances, simplifyDebts } from './balance.js';

test('splitEvenly keeps every penny (10.00 between 3)', () => {
  const shares = splitEvenly(1000, ['a', 'b', 'c']);
  assert.equal(Object.values(shares).reduce((x, y) => x + y, 0), 1000);
  assert.deepEqual(Object.values(shares).sort(), [333, 333, 334]);
});

test('balances always sum to zero', () => {
  const expenses = [
    { amount: 4500, payerId: 'a', splitBetween: ['a', 'b', 'c'] },
    { amount: 1234, payerId: 'b', splitBetween: ['b', 'c'] },
  ];
  const bal = computeBalances(['a', 'b', 'c'], expenses);
  assert.equal(Object.values(bal).reduce((x, y) => x + y, 0), 0);
  assert.equal(bal.a, 3000);
});

test('simplifyDebts clears all balances with few transfers', () => {
  const bal = { a: 3000, b: -1000, c: -2000, d: 0 };
  const transfers = simplifyDebts(bal);
  assert.ok(transfers.length <= 2);
  const after = { ...bal };
  for (const t of transfers) { after[t.from] += t.amount; after[t.to] -= t.amount; }
  assert.ok(Object.values(after).every((v) => v === 0));
});

test('a recorded settlement reduces what is owed', () => {
  const expenses = [{ amount: 2000, payerId: 'a', splitBetween: ['a', 'b'] }];
  const before = computeBalances(['a', 'b'], expenses);
  assert.equal(before.b, -1000);
  const after = computeBalances(['a', 'b'], expenses, [{ from: 'b', to: 'a', amount: 1000 }]);
  assert.equal(after.b, 0);
});
