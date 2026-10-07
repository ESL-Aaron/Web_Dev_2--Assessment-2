import React, { useState } from 'react';
import Home from './components/Home.jsx';
import Room from './components/Room.jsx';

const KEY = 'splitup-session';

function loadSession() {
  try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; }
}

export default function App() {
  // The session ({ code, userId }) lives in localStorage so a refresh keeps you in your room.
  const [session, setSession] = useState(loadSession);
  const [notice, setNotice] = useState('');

  function enter(next) {
    localStorage.setItem(KEY, JSON.stringify(next));
    setNotice('');
    setSession(next);
  }

  function leave(message = '') {
    localStorage.removeItem(KEY);
    setNotice(message);
    setSession(null);
  }

  return session
    ? <Room session={session} onLeave={leave} />
    : <Home onEnter={enter} notice={notice} />;
}
