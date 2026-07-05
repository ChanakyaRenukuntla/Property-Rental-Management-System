// src/pages/auth/SignupPage.js

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function SignupPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [role, setRole] = useState('owner');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }

    setLoading(true);
    try {
      const res = await authAPI.signup({ name: form.name, email: form.email, phone: form.phone, password: form.password, role });
      login(res.data.user, res.data.token);
      navigate(role === 'owner' ? '/owner' : '/tenant');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed.');
    } finally {
      setLoading(false);
    }
  };

  const isOwner = role === 'owner';

  return (
    <div style={styles.page}>
      <div style={{ ...styles.blob, background: 'var(--accent)', top: '-100px', left: '-100px' }} />
      <div style={{ ...styles.blob, background: 'var(--purple)', bottom: '-80px', right: '-80px' }} />

      <div style={styles.card}>
        <div style={styles.logo}>P</div>
        <h1 style={styles.brand}>PropEase</h1>
        <p style={styles.sub}>Create your account</p>

        <div style={styles.tabs}>
          <button style={{ ...styles.tab, ...(isOwner ? styles.tabActive(false) : {}) }} onClick={() => setRole('owner')}>🏢 I'm an Owner</button>
          <button style={{ ...styles.tab, ...(!isOwner ? styles.tabActive(true) : {}) }} onClick={() => setRole('tenant')}>🏠 I'm a Tenant</button>
        </div>

        {error && <div style={styles.errorBox}>⚠️ {error}</div>}

        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
          <div className="form-group">
            <label>Full Name</label>
            <input className="form-input" name="name" placeholder="Rahul Sharma" value={form.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input className="form-input" name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input className="form-input" name="phone" placeholder="+91 98765 43210" value={form.phone} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input className="form-input" name="password" type="password" placeholder="Min. 6 characters" value={form.password} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input className="form-input" name="confirm" type="password" placeholder="Repeat password" value={form.confirm} onChange={handleChange} required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }} disabled={loading}>
            {loading ? '⏳ Creating account...' : `Create ${isOwner ? 'Owner' : 'Tenant'} Account`}
          </button>
        </form>

        <p style={styles.switchText}>
          Already have an account? <Link to="/login" style={{ color: 'var(--accent)' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--bg), var(--bg2))', position: 'relative', overflow: 'hidden', padding: 20 },
  blob: { position: 'absolute', width: 400, height: 400, borderRadius: '50%', filter: 'blur(70px)', opacity: 0.12, pointerEvents: 'none' },
  card: { position: 'relative', zIndex: 1, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r3)', padding: '32px', width: '100%', maxWidth: 420, textAlign: 'center', boxShadow: '0 8px 48px rgba(0,0,0,.5)', maxHeight: '95vh', overflowY: 'auto' },
  logo: { width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg,var(--accent),var(--purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font2)', fontWeight: 700, fontSize: 20, color: '#fff', margin: '0 auto 10px' },
  brand: { fontFamily: 'var(--font2)', fontSize: 22, fontWeight: 700, marginBottom: 3 },
  sub: { fontSize: 12, color: 'var(--text3)', marginBottom: 20 },
  tabs: { display: 'flex', background: 'var(--bg3)', borderRadius: 10, padding: 4, marginBottom: 18, border: '1px solid var(--border)' },
  tab: { flex: 1, padding: '8px 0', borderRadius: 8, background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: 12.5, fontWeight: 500, fontFamily: 'var(--font)' },
  tabActive: (t) => ({ background: t ? 'var(--green2)' : 'var(--accent)', color: '#fff' }),
  errorBox: { background: 'rgba(255,107,107,.1)', border: '1px solid rgba(255,107,107,.2)', borderRadius: 8, padding: '9px 12px', fontSize: 12.5, color: 'var(--red)', marginBottom: 12, textAlign: 'left' },
  switchText: { marginTop: 16, fontSize: 12.5, color: 'var(--text3)' }
};
