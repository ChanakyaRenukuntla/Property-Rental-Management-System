// src/pages/owner/OwnerMaintenance.js

import React, { useEffect, useState } from 'react';
import { maintenanceAPI } from '../../services/api';

const STATUS_BADGE    = { pending: 'badge-amber', 'in-progress': 'badge-accent', completed: 'badge-green', rejected: 'badge-red' };
const PRIORITY_ICON   = { low: '🟢', medium: '🟡', high: '🔴' };
const STATUS_OPTIONS  = ['pending','in-progress','completed','rejected'];

export default function OwnerMaintenance({ showToast }) {
  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(null); // holds the request being responded to

  const fetchAll = async () => {
    try {
      const res = await maintenanceAPI.getAll();
      setRequests(res.data.requests);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleUpdate = async (id, updates) => {
    try {
      await maintenanceAPI.update(id, updates);
      showToast('Request updated!', '🔧');
      setModal(null);
      fetchAll();
    } catch (_) { showToast('Error updating', '❌'); }
  };

  if (loading) return <div style={{color:'var(--text3)',padding:20}}>Loading requests...</div>;

  const pending    = requests.filter(r => r.status === 'pending').length;
  const inProgress = requests.filter(r => r.status === 'in-progress').length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Maintenance</h1>
          <p className="page-subtitle">{requests.length} total requests</p>
        </div>
      </div>

      {/* Mini stats */}
      <div className="stats-grid" style={{marginBottom:20}}>
        <div className="stat-card"><div className="stat-label">Pending</div><div className="stat-value" style={{color:'var(--amber)'}}>{pending}</div></div>
        <div className="stat-card"><div className="stat-label">In Progress</div><div className="stat-value" style={{color:'var(--accent)'}}>{inProgress}</div></div>
        <div className="stat-card"><div className="stat-label">Total</div><div className="stat-value">{requests.length}</div></div>
      </div>

      {requests.length === 0 ? (
        <div className="empty card"><div className="empty-icon">🔧</div><div className="empty-text">No maintenance requests yet</div></div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {requests.map(r => (
            <div key={r._id} className="card" style={{display:'flex',gap:14,alignItems:'flex-start'}}>
              <div style={{fontSize:22,marginTop:2}}>{PRIORITY_ICON[r.priority] || '⚪'}</div>
              <div style={{flex:1}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4,flexWrap:'wrap'}}>
                  <span style={{fontWeight:600,color:'var(--text)',fontSize:14}}>{r.title}</span>
                  <span className={`badge ${STATUS_BADGE[r.status]||'badge-gray'}`}>{r.status}</span>
                  <span className="badge badge-gray">{r.priority} priority</span>
                </div>
                <div style={{fontSize:12,color:'var(--text3)',marginBottom:6}}>
                  🏠 {r.property?.title || '—'} · 👤 {r.tenant?.name || '—'} · 📂 {r.category}
                </div>
                <div style={{fontSize:13,color:'var(--text2)',marginBottom:r.ownerNote?8:0}}>{r.description}</div>
                {r.ownerNote && (
                  <div style={{fontSize:12,color:'var(--accent)',background:'rgba(108,143,255,.07)',padding:'6px 10px',borderRadius:7,borderLeft:'3px solid var(--accent)'}}>
                    💬 Your note: {r.ownerNote}
                  </div>
                )}
              </div>
              <div style={{display:'flex',gap:8,flexShrink:0}}>
                <button className="btn btn-ghost btn-sm" onClick={() => setModal(r)}>Respond</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* RESPOND MODAL */}
      {modal && (
        <RespondModal
          request={modal}
          onClose={() => setModal(null)}
          onSave={handleUpdate}
        />
      )}
    </div>
  );
}

function RespondModal({ request, onClose, onSave }) {
  const [status,    setStatus]    = useState(request.status);
  const [ownerNote, setOwnerNote] = useState(request.ownerNote || '');
  const [saving,    setSaving]    = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(request._id, { status, ownerNote });
    setSaving(false);
  };

  return (
    <div className="modal-overlay open" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">🔧 Respond to Request</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div style={{background:'var(--bg3)',borderRadius:'var(--r)',padding:'12px 14px',marginBottom:18}}>
          <div style={{fontWeight:600,color:'var(--text)',marginBottom:4}}>{request.title}</div>
          <div style={{fontSize:12.5,color:'var(--text2)'}}>{request.description}</div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Update Status</label>
            <select className="form-select" value={status} onChange={e => setStatus(e.target.value)}>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Note to Tenant</label>
            <textarea className="form-textarea" value={ownerNote} onChange={e => setOwnerNote(e.target.value)} placeholder="e.g. Plumber scheduled for tomorrow 10am..." />
          </div>
          <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving?'Saving...':'Save Response'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
