// Tiny JSON-file store so the project runs with `npm install && npm start` and no database setup.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dataDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data');
const dbFile = path.join(dataDir, 'db.json');

let db = { rooms: {} };
if (fs.existsSync(dbFile)) db = JSON.parse(fs.readFileSync(dbFile, 'utf8'));

function persist() {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(`${dbFile}.tmp`, JSON.stringify(db, null, 2));
  fs.renameSync(`${dbFile}.tmp`, dbFile); // atomic swap avoids half-written files
}

export const getRoom = (code) => db.rooms[String(code).toUpperCase()];

export function saveRoom(room) {
  db.rooms[room.code] = room;
  persist();
}

export const roomExists = (code) => Boolean(getRoom(code));
