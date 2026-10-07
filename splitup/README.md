# SplitUp

A responsive group expense splitter. Create a trip, share the six-letter code, log who paid for what (with optional receipt photos), and see the fewest payments needed to settle up. SplitUp never moves money; people leave their own payment details for others to use.

Built for Web Dev II (CCO5104-20) Multi-Device Application Assessment: React front end, Express back end.

## Run it

```bash
npm install
npm run build   # builds the React app into /dist
npm start       # http://localhost:3001 (Express serves the API and the built app)
```

Development with hot reload (React on :5173, API on :3001):

```bash
npm run dev
```

Run the unit tests for the money logic:

```bash
npm test
```

## Structure

```
server/
  index.js          Express API, receipt uploads (multer), serves the built app
  balance.js        Pure functions: even split, net balances, debt simplification
  balance.test.js   Unit tests (node:test)
  store.js          JSON-file persistence (data/db.json, created on first run)
src/
  App.jsx           Session handling (code + user id kept in localStorage)
  api.js            fetch wrapper for every endpoint
  components/       Home, Room, ExpenseList, ExpenseForm, Balances, Settle
  styles.css        Mobile-first CSS; tablet at 600px, desktop at 900px
```

## API

| Method | Route | Purpose |
| --- | --- | --- |
| POST | /api/rooms | Create a room and its first member |
| POST | /api/rooms/:code/join | Join with a display name |
| GET | /api/rooms/:code | Room, balances and suggested payments |
| POST | /api/rooms/:code/expenses | Add an expense (multipart, optional `receipt` image) |
| DELETE | /api/rooms/:code/expenses/:id | Remove an expense |
| PATCH | /api/rooms/:code/members/:id | Save your payment details |
| POST | /api/rooms/:code/settlements | Record a payment as made |

## Key decisions

- Money is stored as integer pence, so splits never suffer floating point drift. Leftover pence from uneven splits are handed out one at a time so shares always sum to the total.
- Balances and suggested payments are computed on the server, so every device sees the same numbers.
- Layout: bottom tab bar and floating add button on phones; all three panels visible side by side on desktop.
