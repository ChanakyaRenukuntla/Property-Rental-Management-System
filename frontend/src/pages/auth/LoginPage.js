// ============================================================
// src/pages/auth/LoginPage.js
// ============================================================

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const navigate  = useNavigate();
  const { login } = useAuth();

  // Form state
  const [role,     setRole]     = useState('owner');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Call POST /api/auth/login
      const res = await authAPI.login({ email, password });
      const { user, token } = res.data;

      // Make sure the selected role matches the account role
      if (user.role !== role) {
        setError(`This account is a ${user.role} account. Please select the correct role.`);
        setLoading(false);
        return;
      }

      // Save token + user to context & localStorage
      login(user, token);

      // Redirect to the correct dashboard
      navigate(user.role === 'owner' ? '/owner' : '/tenant');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isOwner = role === 'owner';

  return (
    <div style={styles.page}>
      {/* Animated background blobs */}
      <div style={{...styles.blob, background: 'var(--accent)',  top: '-100px', left: '-100px'}} />
      <div style={{...styles.blob, background: 'var(--purple)',  bottom: '-80px', right: '-80px'}} />

      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logo}>P</div>
        <h1 style={styles.brand}>PropEase</h1>
        <p style={styles.sub}>Property Rental Management</p>

        {/* Role Tabs */}
        <div style={styles.tabs}>
          <button style={{...styles.tab, ...(isOwner  ? styles.tabActive(false) : {})}} onClick={() => setRole('owner')}>🏢 Owner</button>
          <button style={{...styles.tab, ...(!isOwner ? styles.tabActive(true)  : {})}} onClick={() => setRole('tenant')}>🏠 Tenant</button>
        </div>

        <h2 style={styles.title}>Welcome back</h2>
        <p  style={styles.subtitle}>Sign in as {isOwner ? 'Property Owner' : 'Tenant'}</p>

        {error && <div style={styles.errorBox}>⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input className="form-input" type="email" placeholder="you@example.com"
              value={email} onChange={e => setEmail(e.target.value)} required />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input className="form-input" type="password" placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)} required />
          </div>

          <button type="submit" className="btn btn-primary" style={{width: '100%', justifyContent: 'center', marginTop: 8}}
            disabled={loading}>
            {loading ? '⏳ Signing in...' : `Sign in as ${isOwner ? 'Owner' : 'Tenant'}`}
          </button>
        </form>

        <p style={styles.switchText}>
          Don't have an account? <Link to="/signup" style={{color: 'var(--accent)'}}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, var(--bg), var(--bg2))',
    position: 'relative',
    overflow: 'hidden',
    padding: 20
  },
  blob: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: '50%',
    filter: 'blur(70px)',
    opacity: 0.12,
    pointerEvents: 'none'
  },
  card: {
    position: 'relative',
    zIndex: 1,
    background: 'var(--bg2)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--r3)',
    padding: '36px 32px',
    width: '100%',
    maxWidth: 420,
    textAlign: 'center',
    boxShadow: '0 8px 48px rgba(0,0,0,.5)'
  },
  logo: {
    width: 56, height: 56, borderRadius: 14,
    background: 'linear-gradient(135deg,var(--accent),var(--purple))',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--font2)', fontWeight: 700, fontSize: 24, color: '#fff',
    margin: '0 auto 12px'
  },
  brand:    { fontFamily: 'var(--font2)', fontSize: 24, fontWeight: 700, marginBottom: 4 },
  sub:      { fontSize: 12, color: 'var(--text3)', marginBottom: 24 },
  tabs:     { display: 'flex', background: 'var(--bg3)', borderRadius: 10, padding: 4, marginBottom: 22, border: '1px solid var(--border)' },
  tab:      { flex: 1, padding: '8px 0', borderRadius: 8, background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: 'var(--font)' },
  tabActive: (isTenant) => ({
    background: isTenant ? 'var(--green2)' : 'var(--accent)',
    color: '#fff',
    boxShadow: '0 2px 10px rgba(108,143,255,.3)'
  }),
  title:     { fontFamily: 'var(--font2)', fontSize: 20, fontWeight: 700, textAlign: 'left', marginBottom: 3 },
  subtitle:  { fontSize: 12.5, color: 'var(--text3)', textAlign: 'left', marginBottom: 20 },
  errorBox:  { background: 'rgba(255,107,107,.1)', border: '1px solid rgba(255,107,107,.2)', borderRadius: 8, padding: '10px 12px', fontSize: 12.5, color: 'var(--red)', marginBottom: 14, textAlign: 'left' },
  switchText: { marginTop: 20, fontSize: 12.5, color: 'var(--text3)' }
};
