import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/authService';

function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const user = await authService.login(form);
      localStorage.setItem('gatherlyUser', JSON.stringify(user));
      navigate('/');
      window.location.reload();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Login failed. Check your email and password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-3xl border-2 border-[#d6c4ff] bg-white p-7 shadow-[0_0_25px_#d7a9ff]">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8a5bd3]">Welcome back ✨</p>
        <h1 className="mt-1 text-3xl font-black text-[#341257]">Sign in</h1>
        <p className="mt-2 text-sm text-gray-600">Continue finding your people.</p>
        {error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}
        <label className="mt-5 block text-sm font-semibold text-gray-700">
          Email
          <input type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="join-gang-input" />
        </label>
        <label className="mt-3 block text-sm font-semibold text-gray-700">
          Password
          <input type="password" required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="join-gang-input" />
        </label>
        <button type="submit" disabled={isLoading} className="gatherly-glow-button mt-5 w-full px-4 py-3 text-sm font-black text-[#241455] disabled:opacity-60">
          {isLoading ? 'SIGNING IN...' : 'SIGN IN ✨'}
        </button>
        <p className="mt-5 text-center text-sm text-gray-600">New here? <Link to="/register" className="font-bold text-[#7250cf]">Create an account</Link></p>
      </form>
    </main>
  );
}

export default Login;
