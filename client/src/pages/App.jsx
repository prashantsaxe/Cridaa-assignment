import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

function AuthForm({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: 'demo',
    password: 'demo',
    email: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
      const payload = isLogin 
        ? { username: formData.username, password: formData.password }
        : formData;
      
      const { data } = await axios.post(`${API_BASE}${endpoint}`, payload);
      onLogin(data.token, data.user);
    } catch (err) {
      setError(err.response?.data?.message || `${isLogin ? 'Login' : 'Signup'} failed`);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    if (!isLogin) {
      // Switching to login, prefill demo credentials
      setFormData({ username: 'demo', password: 'demo', email: '' });
    } else {
      // Switching to signup, clear form
      setFormData({ username: '', password: '', email: '' });
    }
  };

  return (
    <div className="max-w-sm mx-auto bg-white shadow rounded p-6 space-y-4">
      <h2 className="text-xl font-semibold text-center">
        {isLogin ? 'Sign In' : 'Create Account'}
      </h2>
      
      {error && <div className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</div>}
      
      <form onSubmit={submit} className="space-y-4">
        <input 
          className="w-full border rounded px-3 py-2" 
          name="username"
          value={formData.username} 
          onChange={handleChange} 
          placeholder="Username" 
          required
        />
        
        {!isLogin && (
          <input 
            className="w-full border rounded px-3 py-2" 
            name="email"
            type="email"
            value={formData.email} 
            onChange={handleChange} 
            placeholder="Email" 
            required
          />
        )}
        
        <input 
          className="w-full border rounded px-3 py-2" 
          name="password"
          type="password" 
          value={formData.password} 
          onChange={handleChange} 
          placeholder="Password" 
          required
        />
        
        <button 
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 disabled:bg-blue-400 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
        </button>
      </form>
      
      <div className="text-center">
        <button 
          type="button"
          onClick={toggleMode}
          className="text-blue-600 text-sm hover:underline"
        >
          {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>
      </div>
      
      {isLogin && (
        <div className="text-xs text-gray-500 text-center bg-gray-50 p-2 rounded">
          Demo: username: demo, password: demo
        </div>
      )}
    </div>
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

function MyBookingCard({ slot, onCancel, cancelling }) {
  return (
    <div className="p-3 bg-white border rounded flex justify-between items-center">
      <div className="flex-1">
        <div className="font-medium text-sm">{slot.date} {slot.time}</div>
        <div className="text-xs text-gray-500">{slot.court}</div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-emerald-600 font-medium text-sm">Booked</span>
        <button 
          onClick={() => onCancel(slot.id)}
          disabled={cancelling}
          className="text-xs bg-red-500 disabled:bg-gray-400 text-white px-2 py-1 rounded hover:bg-red-600 transition"
        >
          {cancelling ? 'Cancelling...' : 'Cancel'}
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [slots, setSlots] = useState([]);
  const [mySlots, setMySlots] = useState([]);
  const [bookingId, setBookingId] = useState('');
  const [cancellingId, setCancellingId] = useState('');

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

  const cancelBooking = async (id) => {
    setCancellingId(id);
    try {
      await axios.delete(`${API_BASE}/api/slots/${id}/cancel`, { headers: authHeader });
      await Promise.all([fetchSlots(), fetchMine()]);
    } catch (e) {
      alert(e.response?.data?.message || 'Cancellation failed');
    } finally {
      setCancellingId('');
    }
  };

  const logout = () => { 
    setToken(''); 
    setUser(null);
    localStorage.removeItem('token'); 
    localStorage.removeItem('user');
  };
  
  const handleLogin = (t, userData) => { 
    setToken(t); 
    setUser(userData);
    localStorage.setItem('token', t); 
    localStorage.setItem('user', JSON.stringify(userData));
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-blue-600 text-white p-4 flex justify-between items-center">
        <h1 className="font-semibold text-lg">Cridaa Court Booking</h1>
        {token && (
          <div className="flex items-center gap-4">
            <span className="text-sm">Welcome, {user?.username}!</span>
            <button onClick={logout} className="text-sm bg-blue-800 px-3 py-1 rounded hover:bg-blue-900 transition">
              Logout
            </button>
          </div>
        )}
      </header>
      
      <main className="flex-1 container mx-auto p-4">
        {!token && (
          <div className="py-10">
            <AuthForm onLogin={handleLogin} />
          </div>
        )}
        
        {token && (
          <div className="grid md:grid-cols-3 gap-6">
            <section className="md:col-span-2 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Available Slots</h2>
                <button 
                  onClick={fetchSlots} 
                  className="text-sm bg-gray-200 px-3 py-2 rounded hover:bg-gray-300 transition"
                >
                  Refresh
                </button>
              </div>
              
              {slots.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No slots available at the moment</p>
                  <p className="text-sm">Check back later or refresh the page</p>
                </div>
              )}
              
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {slots.map(s => (
                  <SlotCard 
                    key={s.id} 
                    slot={s} 
                    onBook={book} 
                    booking={bookingId === s.id} 
                  />
                ))}
              </div>
            </section>
            
            <section className="space-y-4">
              <h2 className="text-xl font-semibold">My Bookings</h2>
              
              {mySlots.length === 0 && (
                <div className="text-center py-6 text-gray-500">
                  <p className="text-sm">No bookings yet</p>
                  <p className="text-xs">Book a slot to see it here</p>
                </div>
              )}
              
              <div className="space-y-2">
                {mySlots.map(s => (
                  <MyBookingCard 
                    key={s.id} 
                    slot={s} 
                    onCancel={cancelBooking}
                    cancelling={cancellingId === s.id}
                  />
                ))}
              </div>
            </section>
          </div>
        )}
      </main>
      
      <footer className="p-4 text-center text-xs text-gray-500 border-t bg-white">
        Cridaa Assignment Demo &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
