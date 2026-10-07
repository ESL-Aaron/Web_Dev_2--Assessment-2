// Thin wrapper around fetch so components deal with plain data and thrown Errors.
async function request(url, options = {}) {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || 'Something went wrong. Try again.'), { code: data.code });
  return data;
}

const json = (method, body) => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export const createRoom = (name, displayName, currency) => request('/api/rooms', json('POST', { name, displayName, currency }));
export const joinRoom = (code, displayName, rejoin = false) => request(`/api/rooms/${code}/join`, json('POST', { displayName, rejoin }));
export const getRoom = (code) => request(`/api/rooms/${code}`);
export const addExpense = (code, formData) => request(`/api/rooms/${code}/expenses`, { method: 'POST', body: formData });
export const deleteExpense = (code, id) => request(`/api/rooms/${code}/expenses/${id}`, { method: 'DELETE' });
export const saveBank = (code, memberId, bank) => request(`/api/rooms/${code}/members/${memberId}`, json('PATCH', { bank }));
export const recordPayment = (code, payment) => request(`/api/rooms/${code}/settlements`, json('POST', payment));
