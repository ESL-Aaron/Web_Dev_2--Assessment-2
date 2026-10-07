import express from 'express';
import multer from 'multer';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getRoom, saveRoom, roomExists } from './store.js';
import { computeBalances, simplifyDebts } from './balance.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const uploadDir = path.join(root, 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const IMAGE_TYPES = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/heic': '.heic' };
const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (_req, file, cb) => cb(null, crypto.randomUUID() + IMAGE_TYPES[file.mimetype]),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, file.mimetype in IMAGE_TYPES),
});

const app = express();
app.use(express.json());
app.use('/uploads', express.static(uploadDir));

// ---------- helpers ----------
const newId = () => crypto.randomUUID().slice(0, 8);
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I to avoid misreading
function newCode() {
  let code;
  do {
    code = Array.from({ length: 6 }, () => CODE_CHARS[crypto.randomInt(CODE_CHARS.length)]).join('');
  } while (roomExists(code));
  return code;
}
const CURRENCIES = ['GBP', 'EUR', 'USD', 'BRL', 'CAD', 'AUD', 'CHF', 'INR'];
const clean = (value, max) => String(value ?? '').trim().slice(0, max);

class HttpError extends Error {
  constructor(status, message, code) { super(message); this.status = status; this.code = code; }
}

function findRoom(code) {
  const room = getRoom(code);
  if (!room) throw new HttpError(404, 'Room not found. Check the code and try again.');
  return room;
}

/** The room plus computed balances and suggested transfers, ready for the client. */
function roomView(room) {
  const balances = computeBalances(room.members.map((m) => m.id), room.expenses, room.settlements);
  return { ...room, currency: room.currency || 'GBP', balances, transfers: simplifyDebts(balances) };
}

const handle = (fn) => (req, res, next) => {
  try { fn(req, res); } catch (err) { next(err); }
};

// ---------- routes ----------
app.post('/api/rooms', handle((req, res) => {
  const name = clean(req.body.name, 40);
  const displayName = clean(req.body.displayName, 30);
  if (!name || !displayName) throw new HttpError(400, 'Enter a trip name and your name.');
  const currency = CURRENCIES.includes(req.body.currency) ? req.body.currency : 'GBP';
  const member = { id: newId(), name: displayName, bank: '' };
  const room = { code: newCode(), name, currency, members: [member], expenses: [], settlements: [], createdAt: Date.now() };
  saveRoom(room);
  res.status(201).json({ userId: member.id, room: roomView(room) });
}));

app.post('/api/rooms/:code/join', handle((req, res) => {
  const room = findRoom(req.params.code);
  const displayName = clean(req.body.displayName, 30);
  if (!displayName) throw new HttpError(400, 'Enter your name to join.');
  // Same name as an existing member: the client must confirm "that's me" (rejoin: true).
  // There are no passwords, so the room code is the only key; fine for a trusted group of friends.
  const existing = room.members.find((m) => m.name.toLowerCase() === displayName.toLowerCase());
  if (existing && req.body.rejoin) {
    return res.json({ userId: existing.id, room: roomView(room) });
  }
  if (existing) {
    throw new HttpError(409, `${existing.name} is already in this room.`, 'NAME_TAKEN');
  }
  const member = { id: newId(), name: displayName, bank: '' };
  room.members.push(member);
  saveRoom(room);
  res.status(201).json({ userId: member.id, room: roomView(room) });
}));

app.get('/api/rooms/:code', handle((req, res) => {
  res.json(roomView(findRoom(req.params.code)));
}));

app.post('/api/rooms/:code/expenses', upload.single('receipt'), handle((req, res) => {
  const room = findRoom(req.params.code);
  const title = clean(req.body.title, 60);
  const amount = Math.round(parseFloat(req.body.amount) * 100);
  const payerId = req.body.payerId;
  let splitBetween;
  try { splitBetween = JSON.parse(req.body.splitBetween); } catch { splitBetween = []; }

  const ids = new Set(room.members.map((m) => m.id));
  if (!title) throw new HttpError(400, 'Add a short description, e.g. "Parking".');
  if (!Number.isFinite(amount) || amount <= 0 || amount > 10_000_000) throw new HttpError(400, 'Enter an amount above zero.');
  if (!ids.has(payerId)) throw new HttpError(400, 'Choose who paid.');
  if (!Array.isArray(splitBetween) || !splitBetween.length || !splitBetween.every((id) => ids.has(id))) {
    throw new HttpError(400, 'Choose at least one person to split with.');
  }

  room.expenses.unshift({
    id: newId(), title, amount, payerId, splitBetween,
    category: clean(req.body.category, 20) || 'Other',
    receiptUrl: req.file ? `/uploads/${req.file.filename}` : null,
    createdAt: Date.now(),
  });
  saveRoom(room);
  res.status(201).json(roomView(room));
}));

app.delete('/api/rooms/:code/expenses/:id', handle((req, res) => {
  const room = findRoom(req.params.code);
  const expense = room.expenses.find((e) => e.id === req.params.id);
  if (!expense) throw new HttpError(404, 'Expense not found.');
  if (expense.receiptUrl) fs.rm(path.join(root, expense.receiptUrl), { force: true }, () => {});
  room.expenses = room.expenses.filter((e) => e.id !== expense.id);
  saveRoom(room);
  res.json(roomView(room));
}));

app.patch('/api/rooms/:code/members/:id', handle((req, res) => {
  const room = findRoom(req.params.code);
  const member = room.members.find((m) => m.id === req.params.id);
  if (!member) throw new HttpError(404, 'Member not found.');
  member.bank = clean(req.body.bank, 300);
  saveRoom(room);
  res.json(roomView(room));
}));

app.post('/api/rooms/:code/settlements', handle((req, res) => {
  const room = findRoom(req.params.code);
  const { from, to } = req.body;
  const amount = Math.round(Number(req.body.amount));
  const ids = new Set(room.members.map((m) => m.id));
  if (!ids.has(from) || !ids.has(to) || from === to || !(amount > 0)) throw new HttpError(400, 'Invalid payment.');
  room.settlements.push({ id: newId(), from, to, amount, createdAt: Date.now() });
  saveRoom(room);
  res.status(201).json(roomView(room));
}));

// ---------- production: serve the built React app ----------
const dist = path.join(root, 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^\/(?!api|uploads).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use('/api', (_req, _res, next) => next(new HttpError(404, 'Not found.')));
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const status = err instanceof multer.MulterError ? 400 : err.status || 500;
  const message = err instanceof multer.MulterError ? 'That photo is too large (5 MB max).' : err.message;
  if (status === 500) console.error(err);
  res.status(status).json({ error: status === 500 ? 'Something went wrong on our side.' : message, code: err.code });
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`SplitUp API listening on http://localhost:${port}`));
