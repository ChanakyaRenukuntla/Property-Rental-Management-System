// src/pages/tenant/TenantMessages.js

import React, { useEffect, useState, useRef } from 'react';
import { messageAPI, tenantAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function TenantMessages({ showToast, onRead }) {
  const { user }           = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [messages,      setMessages]      = useState([]);
  const [text,          setText]          = useState('');
  const [sending,       setSending]       = useState(false);
  const bottomRef = useRef();

  const fetchConversations = async () => {
    try {
      const res = await messageAPI.getConversations();
      setConversations(res.data.conversations);
      
      // Auto-select first conversation if none selected
      if (res.data.conversations.length > 0) {
        setActiveContact(prev => prev || res.data.conversations[0].contact);
      }
    } catch (_) {}
  };

  const fetchMessages = async (contactId) => {
    try {
      const res = await messageAPI.getMessages(contactId);
      setMessages(res.data.messages);
      onRead && onRead();
    } catch (_) {}
  };

  useEffect(() => { fetchConversations(); }, []);

  useEffect(() => {
    if (activeContact) fetchMessages(activeContact._id);
  }, [activeContact]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activeContact) return;
    setSending(true);
    try {
      await messageAPI.send({ receiverId: activeContact._id, text });
      setText('');
      fetchMessages(activeContact._id);
      fetchConversations();
    } catch (_) { showToast('Error sending', '❌'); }
    setSending(false);
  };

  const getInitials = (name = '') => name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Messages</h1>
          <p className="page-subtitle">Chat with property owners</p>
        </div>
      </div>

      <div style={{display:'flex',gap:16,height:'calc(100vh - 160px)'}}>
        
        {/* LEFT: Conversations list */}
        <div className="card" style={{width:280,flexShrink:0,padding:0,overflow:'hidden',display:'flex',flexDirection:'column'}}>
          <div style={{padding:'14px 16px',borderBottom:'1px solid var(--border)',fontWeight:600,fontSize:13,color:'var(--text)'}}>
            Conversations
          </div>
          <div style={{overflowY:'auto',flex:1}}>
            {conversations.length === 0 ? (
              <div className="empty" style={{padding:30}}>
                <div className="empty-icon">💬</div>
                <div className="empty-text">No conversations yet</div>
              </div>
            ) : conversations.map(conv => (
              <div
                key={conv.contact._id}
                onClick={() => setActiveContact(conv.contact)}
                style={{
                  display:'flex',alignItems:'center',gap:10,padding:'12px 16px',cursor:'pointer',
                  borderBottom:'1px solid var(--border)',transition:'.15s',
                  background: activeContact?._id === conv.contact._id ? 'rgba(15,110,86,.08)' : 'transparent'
                }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,.03)'}
                onMouseLeave={e => e.currentTarget.style.background = activeContact?._id === conv.contact._id ? 'rgba(15,110,86,.08)' : 'transparent'}
              >
                <div style={{width:36,height:36,borderRadius:'50%',background:'linear-gradient(135deg,var(--green2),#0f6e56)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:'#fff',flexShrink:0}}>
                  {getInitials(conv.contact.name)}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:600,color:'var(--text)'}}>{conv.contact.name}</div>
                  <div style={{fontSize:11.5,color:'var(--text3)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                    {conv.lastMessage?.text || '—'}
                  </div>
                </div>
                {conv.unread > 0 && (
                  <span className="nav-badge" style={{marginLeft:'auto'}}>{conv.unread}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Chat window */}
        <div className="card" style={{flex:1,padding:0,display:'flex',flexDirection:'column',overflow:'hidden'}}>
          {activeContact ? (
            <>
              {/* Chat header */}
              <div style={{padding:'14px 18px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:10}}>
                <div style={{width:38,height:38,borderRadius:'50%',background:'linear-gradient(135deg,var(--green2),#0f6e56)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:14,color:'#fff'}}>
                  {getInitials(activeContact.name)}
                </div>
                <div>
                  <div style={{fontWeight:600,color:'var(--text)',fontSize:14}}>{activeContact.name}</div>
                  <div style={{fontSize:11,color:'var(--text3)'}}>Property Owner</div>
                </div>
              </div>

              {/* Messages */}
              <div style={{flex:1,overflowY:'auto',padding:16,display:'flex',flexDirection:'column',gap:8}}>
                {messages.length === 0 ? (
                  <div className="empty"><div className="empty-icon">💬</div><div className="empty-text">No messages yet. Say hello!</div></div>
                ) : messages.map(msg => {
                  const isMine = msg.sender._id === user._id || msg.sender === user._id;
                  return (
                    <div key={msg._id} style={{display:'flex',flexDirection:'column',alignItems: isMine ? 'flex-end' : 'flex-start'}}>
                      <div style={{
                        maxWidth:'70%',padding:'9px 14px',
                        borderRadius: isMine ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                        background: isMine ? 'linear-gradient(135deg,var(--green2),#0f6e56)' : 'var(--bg3)',
                        border: isMine ? 'none' : '1px solid var(--border)',
                        color:'var(--text)',fontSize:13,lineHeight:1.5
                      }}>
                        {msg.text}
                      </div>
                      <div style={{fontSize:10.5,color:'var(--text3)',marginTop:3}}>
                        {isMine ? 'You' : activeContact.name} · {new Date(msg.createdAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSend} style={{padding:'12px 16px',borderTop:'1px solid var(--border)',display:'flex',gap:10}}>
                <input
                  className="form-input"
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder="Type a message to your owner..."
                  style={{flex:1}}
                  autoFocus
                />
                <button type="submit" className="btn btn-sm" style={{background:'linear-gradient(135deg,var(--green2),#0f6e56)',color:'#fff',flexShrink:0}} disabled={!text.trim()||sending}>
                  {sending ? '...' : '➤ Send'}
                </button>
              </form>
            </>
          ) : (
            <div className="empty" style={{height:'100%',justifyContent:'center',display:'flex',flexDirection:'column',alignItems:'center'}}>
              <div className="empty-icon">💬</div>
              <div className="empty-text">Select a conversation to start messaging</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
