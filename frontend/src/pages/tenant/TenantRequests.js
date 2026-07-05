import React, { useEffect, useState } from 'react';
import { requestAPI, propertyAPI } from '../../services/api';

export default function TenantRequests({ showToast, onNavigate }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Booking / Payment Modal states
  const [bookingModal, setBookingModal] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [submitting, setSubmitting] = useState(false);

  const fetchRequests = async () => {
    try {
      const res = await requestAPI.getAll();
      setRequests(res.data.requests);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleBook = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await propertyAPI.bookProperty(bookingModal._id, { paymentMethod });
      showToast('Property booked successfully!', '🎉');
      setBookingModal(null);
      fetchRequests(); // refresh to show updated property status
      if (onNavigate) onNavigate('home');
    } catch (error) {
      console.error(error);
      showToast(error.response?.data?.message || error.message || 'Error booking property', '❌');
    }
    setSubmitting(false);
  };

  if (loading) return <div style={{padding:20, color:'var(--text3)'}}>Loading requests...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Booking Requests</h1>
          <p className="page-subtitle">Track the status of your connection requests</p>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="empty card">
          <div className="empty-icon">📨</div>
          <div className="empty-text">You haven't sent any requests yet.</div>
          <button className="btn btn-primary" onClick={() => onNavigate('properties')} style={{marginTop:10}}>
            Browse Properties
          </button>
        </div>
      ) : (
        <div style={{display:'flex', flexDirection:'column', gap:15}}>
          {requests.map(req => (
            <div key={req._id} className="card" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <div>
                <h3 style={{margin:0}}>{req.isExternal ? req.externalTitle : req.property?.title}</h3>
                <p style={{fontSize:13, color:'var(--text3)', margin:'5px 0'}}>
                  {req.isExternal ? (
                    <span style={{color:'var(--accent)'}}>📍 Live Map Location • Maintained by PropEase Platform</span>
                  ) : (
                    <span>📍 {req.property?.address?.city} • Owner: {req.owner?.name}</span>
                  )}
                </p>
                {!req.isExternal && req.property?.rent && (
                  <p style={{fontSize:13, margin:'5px 0', display:'flex', gap:10}}>
                    <span><span style={{color:'var(--text3)'}}>Rent:</span> <strong>₹{req.property.rent.toLocaleString()}</strong>/mo</span>
                    {req.property.deposit > 0 && <span><span style={{color:'var(--text3)'}}>Deposit:</span> <strong>₹{req.property.deposit.toLocaleString()}</strong></span>}
                  </p>
                )}
                {req.message && (
                  <p style={{fontSize:12, color:'var(--text2)', fontStyle:'italic'}}>"{req.message}"</p>
                )}
              </div>
              <div style={{display:'flex', flexDirection:'column', alignItems:'flex-end', gap:10}}>
                <span className={`badge badge-${req.status === 'accepted' ? 'green' : req.status === 'rejected' ? 'amber' : 'accent'}`}>
                  {req.status}
                </span>
                <div style={{display:'flex', gap: 10}}>
                  {req.status === 'accepted' && (
                    <button className="btn btn-sm btn-ghost" onClick={() => onNavigate('messages')}>
                      Chat
                    </button>
                  )}
                  {req.status === 'accepted' && !req.isExternal && req.property?.status === 'available' && (
                    <button className="btn btn-sm btn-primary" onClick={() => setBookingModal(req.property)}>
                      Pay & Book
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking / Payment Modal */}
      {bookingModal && (
        <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && setBookingModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">Book {bookingModal.title}</span>
              <button className="modal-close" onClick={() => setBookingModal(null)}>✕</button>
            </div>
            
            <div style={{marginBottom: 20}}>
              <p style={{fontSize:14, color:'var(--text2)', marginBottom:10}}>
                You can now complete the booking for this property. The initial amount required is rent + deposit.
              </p>
              <div style={{background:'var(--bg3)', padding:12, borderRadius:8, display:'flex', flexDirection:'column', gap:8}}>
                <div style={{display:'flex', justifyContent:'space-between'}}>
                  <span>Monthly Rent:</span>
                  <strong>₹{bookingModal.rent?.toLocaleString()}</strong>
                </div>
                <div style={{display:'flex', justifyContent:'space-between'}}>
                  <span>Security Deposit:</span>
                  <strong>₹{(bookingModal.deposit || 0).toLocaleString()}</strong>
                </div>
                <div style={{display:'flex', justifyContent:'space-between', borderTop:'1px solid var(--border)', paddingTop:8, marginTop:4}}>
                  <span>Total Payable:</span>
                  <strong style={{color:'var(--accent)', fontSize:16}}>₹{((bookingModal.rent || 0) + (bookingModal.deposit || 0)).toLocaleString()}</strong>
                </div>
              </div>
            </div>

            <form onSubmit={handleBook}>
              <div className="form-group">
                <label>Select Payment Method *</label>
                <select className="form-select" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} required>
                  {bookingModal.paymentOptions && bookingModal.paymentOptions.length > 0 
                    ? bookingModal.paymentOptions.map((opt) => (
                        <option key={opt} value={opt.toLowerCase()}>{opt}</option>
                      ))
                    : (
                      <>
                        <option value="upi">UPI</option>
                        <option value="netbanking">Netbanking</option>
                        <option value="card">Debit / Credit Card</option>
                      </>
                    )
                  }
                </select>
              </div>

              {paymentMethod === 'upi' && (
                <div className="form-group">
                  <label>Enter UPI ID</label>
                  <input className="form-input" placeholder="e.g. username@bank" required />
                </div>
              )}
              {paymentMethod === 'netbanking' && (
                <div className="form-group">
                  <label>Select Bank</label>
                  <select className="form-select" required>
                    <option>HDFC Bank</option>
                    <option>ICICI Bank</option>
                    <option>State Bank of India</option>
                  </select>
                </div>
              )}

              <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:20}}>
                <button type="button" className="btn btn-ghost" onClick={() => setBookingModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Processing...' : 'Pay & Book Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
