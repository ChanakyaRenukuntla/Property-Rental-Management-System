// src/pages/tenant/TenantProperties.js

import React, { useEffect, useState } from 'react';
import { propertyAPI, requestAPI } from '../../services/api';

const TYPE_ICONS = { apartment:'🏢', house:'🏠', studio:'🛋️', villa:'🏰', commercial:'🏬' };

export default function TenantProperties({ showToast }) {
  const [properties, setProperties] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [filter,     setFilter]     = useState('all');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await propertyAPI.getAll();
        setProperties(res.data.properties);
      } catch (_) {}
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = properties.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.address?.city?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || p.status === filter;
    return matchSearch && matchFilter;
  });

  if (loading) return <div style={{color:'var(--text3)',padding:20}}>Loading properties...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">All Properties</h1>
          <p className="page-subtitle">Browse available rental listings</p>
        </div>
      </div>

      {/* Search + Filter */}
      <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
        <input
          className="form-input"
          style={{flex:1,minWidth:200}}
          placeholder="🔍 Search by name or city..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="form-select" style={{width:160}} value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="available">Available</option>
          <option value="occupied">Occupied</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="empty card"><div className="empty-icon">🔍</div><div className="empty-text">No properties found</div></div>
      ) : (
        <div className="prop-grid">
          {filtered.map(prop => (
            <div key={prop._id} className="prop-card">
              <div className="prop-card-img">
                <span>{TYPE_ICONS[prop.type] || '🏠'}</span>
                <span style={{position:'absolute',top:10,right:10}}>
                  <span className={`badge badge-${prop.status==='available'?'green':prop.status==='occupied'?'accent':'amber'}`}>{prop.status}</span>
                </span>
              </div>
              <div className="prop-card-body">
                <div className="prop-card-title">{prop.title}</div>
                <div className="prop-card-addr">📍 {[prop.address?.city, prop.address?.state].filter(Boolean).join(', ') || 'Location not set'}</div>
                <div className="prop-card-rent">₹{prop.rent?.toLocaleString()}<span style={{fontSize:12,color:'var(--text3)',fontWeight:400}}>/month</span></div>
                <div className="prop-card-meta">
                  <span>🛏 {prop.bedrooms} bed</span>
                  <span>🚿 {prop.bathrooms} bath</span>
                  {prop.area > 0 && <span>📐 {prop.area} sqft</span>}
                </div>
                {prop.amenities?.length > 0 && (
                  <div style={{marginTop:8,display:'flex',gap:4,flexWrap:'wrap'}}>
                    {prop.amenities.slice(0,3).map(a => (
                      <span key={a} style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:5,padding:'2px 7px',fontSize:10.5,color:'var(--text3)'}}>✓ {a}</span>
                    ))}
                    {prop.amenities.length > 3 && <span style={{fontSize:10.5,color:'var(--text3)'}}>+{prop.amenities.length-3} more</span>}
                  </div>
                )}
                {prop.description && (
                  <p style={{fontSize:12,color:'var(--text3)',marginTop:8,lineHeight:1.5}}>{prop.description.slice(0,80)}{prop.description.length>80?'...':''}</p>
                )}
                {prop.owner && (
                  <div style={{marginTop:10,fontSize:12,color:'var(--text3)'}}>🏢 Owner: {prop.owner.name}</div>
                )}
                {prop.status === 'available' && (
                  <div style={{ marginTop: 15 }}>
                    <button 
                      className="btn btn-primary" 
                      style={{ width: '100%', justifyContent: 'center' }} 
                      onClick={async () => {
                        const userMsg = window.prompt("Optional: Add a message for the owner", "I am interested in this property.");
                        if (userMsg === null) return;
                        try {
                          await requestAPI.create({ 
                            propertyId: prop._id, 
                            message: userMsg 
                          });
                          if(showToast) showToast(`Booking request sent successfully!`);
                          else alert(`Booking request sent successfully!`);
                        } catch (err) {
                          if(showToast) showToast(err.response?.data?.message || 'Error sending request.', '❌');
                          else alert(err.response?.data?.message || 'Error sending request.');
                        }
                      }}
                    >
                      Request to Book
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
