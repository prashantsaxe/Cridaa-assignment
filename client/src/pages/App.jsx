import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

function Login({ onLogin }) {
  const [username, setUsername] = useState('demo');
  const [password, setPassword] = useState('demo');
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await axios.post(`${API_BASE}/api/auth/login`, { username, password });
      onLogin(data.token);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };
  return (
    <form onSubmit={submit} className="max-w-sm mx-auto bg-white shadow rounded p-6 space-y-4">
      <h2 className="text-xl font-semibold text-center">Login</h2>
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <input className="w-full border rounded px-3 py-2" value={username} onChange={e=>setUsername(e.target.value)} placeholder="Username" />
      <input className="w-full border rounded px-3 py-2" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" />
      <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">Sign In</button>
    </form>
  );
}

function SlotCard({ slot, onBook, booking }) {
  return (
    <div className="border rounded p-4 flex flex-col gap-2 bg-white shadow-sm">
      <div className="font-medium">{slot.date} {slot.time}</div>
      <div className="text-sm text-gray-500">{slot.court}</div>
      <button disabled={booking} onClick={() => onBook(slot.id)} className="bg-emerald-600 disabled:bg-gray-400 text-white px-3 py-1 rounded hover:bg-emerald-700 text-sm">
        {booking ? 'Booking...' : 'Book'}
      </button>
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [slots, setSlots] = useState([]);
  const [mySlots, setMySlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bookingId, setBookingId] = useState('');

  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

  const fetchSlots = async () => {
    const { data } = await axios.get(`${API_BASE}/api/slots`);
    setSlots(data);
  };
  const fetchMine = async () => {
    if (!token) return;
    const { data } = await axios.get(`${API_BASE}/api/slots/mine`, { headers: authHeader });
    setMySlots(data);
  };

  useEffect(() => {
    fetchSlots();
  }, []);
  useEffect(() => { fetchMine(); }, [token]);

  const book = async (id) => {
    if (!token) return alert('Login first');
    setBookingId(id);
    try {
      await axios.post(`${API_BASE}/api/slots/${id}/book`, {}, { headers: authHeader });
      await Promise.all([fetchSlots(), fetchMine()]);
    } catch (e) {
      alert(e.response?.data?.message || 'Booking failed');
    } finally {
      setBookingId('');
    }
  };

  const logout = () => { setToken(''); localStorage.removeItem('token'); };
  const handleLogin = (t) => { setToken(t); localStorage.setItem('token', t); };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-blue-600 text-white p-4 flex justify-between items-center">
        <h1 className="font-semibold text-lg">Cridaa Court Booking</h1>
        {token && <button onClick={logout} className="text-sm bg-blue-800 px-3 py-1 rounded">Logout</button>}
      </header>
      <main className="flex-1 container mx-auto p-4">
        {!token && (<div className="py-10"><Login onLogin={handleLogin} /></div>)}
        {token && (
          <div className="grid md:grid-cols-3 gap-6">
            <section className="md:col-span-2 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Available Slots</h2>
                <button onClick={fetchSlots} className="text-sm bg-gray-200 px-2 py-1 rounded">Refresh</button>
              </div>
              {slots.length === 0 && <div className="text-sm text-gray-500">No slots available</div>}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {slots.map(s => <SlotCard key={s.id} slot={s} onBook={book} booking={bookingId===s.id} />)}
              </div>
            </section>
            <section className="space-y-4">
              <h2 className="text-xl font-semibold">My Bookings</h2>
              {mySlots.length === 0 && <div className="text-sm text-gray-500">No bookings yet.</div>}
              <ul className="space-y-2">
                {mySlots.map(s => (
                  <li key={s.id} className="p-3 bg-white border rounded flex justify-between text-sm"><span>{s.date} {s.time}</span><span className="text-emerald-600 font-medium">Booked</span></li>
                ))}
              </ul>
            </section>
          </div>
        )}
      </main>
      <footer className="p-4 text-center text-xs text-gray-500">Demo assignment &copy; {new Date().getFullYear()}</footer>
    </div>
  );
}
