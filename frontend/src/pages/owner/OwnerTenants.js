// src/pages/owner/OwnerTenants.js

import React, { useEffect, useState } from 'react';
import { tenantAPI, propertyAPI } from '../../services/api';

export default function OwnerTenants({ showToast }) {
  const [tenants,    setTenants]    = useState([]);
  const [properties, setProperties] = useState([]);
  const [allUsers,   setAllUsers]   = useState([]);
  const [modal,      setModal]      = useState(false);
  const [form,       setForm]       = useState({ propertyId: '', tenantUserId: '' });
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);

  const fetchAll = async () => {
    try {
      const [tRes, pRes, uRes] = await Promise.all([
        tenantAPI.getAll(),
        propertyAPI.getAll(),
        tenantAPI.getAllUsers()
      ]);
      setTenants(tRes.data.tenants);
      setProperties(pRes.data.properties);
      setAllUsers(uRes.data.tenants);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleAssign = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await propertyAPI.assignTenant(form.propertyId, form.tenantUserId || null);
      showToast('Tenant assigned!', '✅');
      setModal(false);
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error assigning tenant', '❌');
    }
    setSaving(false);
  };

  const handleRemove = async (propertyId) => {
    if (!window.confirm('Remove tenant from this property?')) return;
    try {
      await propertyAPI.assignTenant(propertyId, null);
      showToast('Tenant removed', '✅');
      fetchAll();
    } catch (_) { showToast('Error removing tenant', '❌'); }
  };

  if (loading) return <div style={{color:'var(--text3)',padding:20}}>Loading tenants...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Tenants</h1>
          <p className="page-subtitle">{tenants.length} active tenants</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm({ propertyId: '', tenantUserId: '' }); setModal(true); }}>
          ➕ Assign Tenant
        </button>
      </div>

      {tenants.length === 0 ? (
        <div className="empty card">
          <div className="empty-icon">👥</div>
          <div className="empty-text">No tenants yet. Assign a tenant to a property to get started.</div>
        </div>
      ) : (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th><th>Email</th><th>Phone</th><th>Property</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t, i) => (
                <tr key={i}>
                  <td>
                    <div style={{display:'flex',alignItems:'center',gap:9}}>
                      <div style={{width:32,height:32,borderRadius:'50%',background:'linear-gradient(135deg,var(--accent),var(--purple))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#fff',flexShrink:0}}>
                        {t.name?.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)}
                      </div>
                      <span style={{color:'var(--text)',fontWeight:500}}>{t.name}</span>
                    </div>
                  </td>
                  <td>{t.email}</td>
                  <td>{t.phone || '—'}</td>
                  <td>
                    <span style={{color:'var(--accent)',fontSize:12.5}}>
                      {t.property?.title || '—'}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => handleRemove(t.property?.id)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ASSIGN MODAL */}
      {modal && (
        <div className="modal-overlay open" onClick={e => e.target===e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">Assign Tenant to Property</span>
              <button className="modal-close" onClick={() => setModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAssign}>
              <div className="form-group">
                <label>Select Property *</label>
                <select className="form-select" value={form.propertyId} onChange={e => setForm({...form, propertyId: e.target.value})} required>
                  <option value="">— Choose Property —</option>
                  {properties.map(p => (
                    <option key={p._id} value={p._id}>{p.title} ({p.status})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Select Tenant User *</label>
                <select className="form-select" value={form.tenantUserId} onChange={e => setForm({...form, tenantUserId: e.target.value})} required>
                  <option value="">— Choose Tenant —</option>
                  {allUsers.map(u => (
                    <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>
              <p style={{fontSize:12,color:'var(--text3)',marginBottom:14}}>
                ℹ️ The tenant must have already signed up with the Tenant role.
              </p>
              <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
                <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Assigning...' : 'Assign'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
