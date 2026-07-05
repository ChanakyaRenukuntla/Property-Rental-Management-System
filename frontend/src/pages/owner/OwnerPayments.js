// src/pages/owner/OwnerPayments.js

import React, { useEffect, useState } from 'react';
import { paymentAPI, propertyAPI, tenantAPI } from '../../services/api';

const STATUS_BADGE = { paid: 'badge-green', pending: 'badge-amber', overdue: 'badge-red' };
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const METHODS = ['cash','bank_transfer','upi','cheque','online'];

export default function OwnerPayments({ showToast }) {
  const [payments,    setPayments]    = useState([]);
  const [properties,  setProperties]  = useState([]);
  const [tenantUsers, setTenantUsers] = useState([]);
  const [modal,       setModal]       = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [form,        setForm]        = useState({ property: '', tenant: '', amount: '', month: '', method: 'cash', status: 'pending', paidOn: '' });

  const now = new Date();
  const defaultMonth = `${MONTHS[now.getMonth()]} ${now.getFullYear()}`;

  const fetchAll = async () => {
    try {
      const [pRes, prRes, tRes] = await Promise.all([
        paymentAPI.getAll(), propertyAPI.getAll(), tenantAPI.getAllUsers()
      ]);
      setPayments(pRes.data.payments);
      setProperties(prRes.data.properties);
      setTenantUsers(tRes.data.tenants);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await paymentAPI.create({ ...form, amount: Number(form.amount) });
      showToast('Payment recorded!', '💳');
      setModal(false);
      fetchAll();
    } catch (err) { showToast(err.response?.data?.message || 'Error', '❌'); }
    setSaving(false);
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await paymentAPI.update(id, { status, paidOn: status === 'paid' ? new Date() : null });
      showToast('Status updated!', '✅');
      fetchAll();
    } catch (_) { showToast('Error updating', '❌'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this payment record?')) return;
    try {
      await paymentAPI.delete(id);
      showToast('Deleted!', '🗑️');
      fetchAll();
    } catch (_) {}
  };

  // Summary stats
  const totalCollected = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const totalPending   = payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0);

  if (loading) return <div style={{color:'var(--text3)',padding:20}}>Loading payments...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Payments</h1>
          <p className="page-subtitle">{payments.length} payment records</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm({ property:'',tenant:'',amount:'',month:defaultMonth,method:'cash',status:'pending',paidOn:'' }); setModal(true); }}>
          ➕ Record Payment
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{marginBottom:20}}>
        <div className="stat-card"><div className="stat-label">Total Collected</div><div className="stat-value" style={{color:'var(--green)'}}>₹{totalCollected.toLocaleString()}</div></div>
        <div className="stat-card"><div className="stat-label">Pending</div><div className="stat-value" style={{color:'var(--amber)'}}>₹{totalPending.toLocaleString()}</div></div>
        <div className="stat-card"><div className="stat-label">Total Records</div><div className="stat-value">{payments.length}</div></div>
      </div>

      <div className="card table-wrap">
        <table>
          <thead>
            <tr><th>Tenant</th><th>Property</th><th>Month</th><th>Amount</th><th>Method</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr><td colSpan="7"><div className="empty"><div className="empty-icon">💳</div><div className="empty-text">No payment records yet</div></div></td></tr>
            ) : payments.map(p => (
              <tr key={p._id}>
                <td style={{color:'var(--text)',fontWeight:500}}>{p.tenant?.name || '—'}</td>
                <td style={{fontSize:12}}>{p.property?.title || '—'}</td>
                <td style={{fontSize:12}}>{p.month || '—'}</td>
                <td style={{color:'var(--accent)',fontWeight:600}}>₹{p.amount?.toLocaleString()}</td>
                <td style={{fontSize:12}}>{p.method}</td>
                <td><span className={`badge ${STATUS_BADGE[p.status] || 'badge-gray'}`}>{p.status}</span></td>
                <td>
                  <div style={{display:'flex',gap:6}}>
                    {p.status !== 'paid' && (
                      <button className="btn btn-sm" style={{background:'rgba(61,220,151,.1)',color:'var(--green)',border:'1px solid rgba(61,220,151,.2)'}} onClick={() => handleStatusUpdate(p._id,'paid')}>✓ Paid</button>
                    )}
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p._id)}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {modal && (
        <div className="modal-overlay open" onClick={e => e.target===e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">💳 Record Payment</span>
              <button className="modal-close" onClick={() => setModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Property *</label>
                <select className="form-select" value={form.property} onChange={e => setForm({...form,property:e.target.value})} required>
                  <option value="">— Select Property —</option>
                  {properties.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Tenant *</label>
                <select className="form-select" value={form.tenant} onChange={e => setForm({...form,tenant:e.target.value})} required>
                  <option value="">— Select Tenant —</option>
                  {tenantUsers.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                </select>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                <div className="form-group">
                  <label>Amount (₹) *</label>
                  <input className="form-input" type="number" value={form.amount} onChange={e => setForm({...form,amount:e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Month</label>
                  <input className="form-input" value={form.month} onChange={e => setForm({...form,month:e.target.value})} placeholder="January 2025" />
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                <div className="form-group">
                  <label>Method</label>
                  <select className="form-select" value={form.method} onChange={e => setForm({...form,method:e.target.value})}>
                    {METHODS.map(m => <option key={m} value={m}>{m.replace('_',' ')}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select className="form-select" value={form.status} onChange={e => setForm({...form,status:e.target.value})}>
                    {['pending','paid','overdue'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:8}}>
                <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving?'Saving...':'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
