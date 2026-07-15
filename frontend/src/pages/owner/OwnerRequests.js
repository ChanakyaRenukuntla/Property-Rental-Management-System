import React, { useEffect, useState } from 'react';
import { requestAPI } from '../../services/api';

export default function OwnerRequests({ showToast, onNavigate }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const res = await requestAPI.getAll();
      setRequests(res.data.requests);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleStatus = async (id, status) => {
    try {
      await requestAPI.updateStatus(id, { status });
      showToast(`Request ${status} successfully!`);
      fetchRequests();
    } catch (err) {
      showToast('Error updating status', '❌');
    }
  };

  if (loading) return <div style={{padding:20, color:'var(--text3)'}}>Loading requests...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Tenant Requests</h1>
          <p className="page-subtitle">Manage incoming booking requests for your properties</p>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="empty card">
          <div className="empty-icon">📂</div>
          <div className="empty-text">No pending requests at the moment.</div>
        </div>
      ) : (
        <div style={{display:'flex', flexDirection:'column', gap:15}}>
          {requests.map(req => (
            <div key={req._id} className="card" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <div>
                <h3 style={{margin:0}}>{req.isExternal ? req.externalTitle : req.property?.title}</h3>
                <p style={{fontSize:13, color:'var(--text3)', margin:'5px 0'}}>
                  Tenant: {req.tenant?.name} ({req.tenant?.email} • {req.tenant?.phone})
                </p>
                {req.message && (
                  <p style={{fontSize:12, color:'var(--text2)', fontStyle:'italic', background:'var(--bg2)', padding:'8px', borderRadius:5}}>"{req.message}"</p>
                )}
                <span className={`badge badge-${req.status === 'accepted' ? 'green' : req.status === 'rejected' ? 'amber' : 'accent'}`} style={{marginTop:10, display:'inline-block'}}>
                  {req.status}
                </span>
              </div>
              <div style={{display:'flex', gap:10}}>
                {req.status === 'pending' && (
                  <>
                    <button className="btn btn-sm btn-ghost" onClick={() => handleStatus(req._id, 'rejected')}>Reject</button>
                    <button className="btn btn-sm btn-primary" onClick={() => handleStatus(req._id, 'accepted')}>Accept</button>
                  </>
                )}
                {req.status === 'accepted' && (
                  <button className="btn btn-sm btn-primary" onClick={() => onNavigate('messages')}>
                    Chat with Tenant
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
