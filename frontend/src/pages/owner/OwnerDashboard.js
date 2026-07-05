// src/pages/owner/OwnerDashboard.js
// This is the SHELL of the owner dashboard. It holds the sidebar
// and shows the correct inner page based on activePage state.

import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/common/Sidebar';
import Toast   from '../../components/common/Toast';
import { messageAPI } from '../../services/api';

// Owner pages
import OwnerHome        from './OwnerHome';
import OwnerProperties  from './OwnerProperties';
import OwnerTenants     from './OwnerTenants';
import OwnerPayments    from './OwnerPayments';
import OwnerMaintenance from './OwnerMaintenance';
import OwnerMessages    from './OwnerMessages';
import OwnerRequests    from './OwnerRequests';

// Sidebar navigation items for the owner
const NAV_ITEMS = [
  { key: 'home',        icon: '📊', label: 'Dashboard'   },
  { key: 'requests',    icon: '📨', label: 'Requests'    },
  { key: 'properties',  icon: '🏢', label: 'Properties'  },
  { key: 'tenants',     icon: '👥', label: 'Tenants'     },
  { key: 'payments',    icon: '💳', label: 'Payments'    },
  { key: 'maintenance', icon: '🔧', label: 'Maintenance' },
  { key: 'messages',    icon: '💬', label: 'Messages'    },
];

export default function OwnerDashboard() {
  const [activePage,  setActivePage]  = useState('home');
  const [toast,       setToast]       = useState({ show: false, message: '', icon: '✅' });
  const [unreadCount, setUnreadCount] = useState(0);

  // Poll for unread messages every 15 seconds
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await messageAPI.getUnreadCount();
        setUnreadCount(res.data.unreadCount);
      } catch (_) {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (message, icon = '✅') => setToast({ show: true, message, icon });

  // Render the active page
  const renderPage = () => {
    const props = { showToast };
    switch (activePage) {
      case 'home':        return <OwnerHome        {...props} onNavigate={setActivePage} />;
      case 'requests':    return <OwnerRequests    {...props} />;
      case 'properties':  return <OwnerProperties  {...props} />;
      case 'tenants':     return <OwnerTenants      {...props} />;
      case 'payments':    return <OwnerPayments     {...props} />;
      case 'maintenance': return <OwnerMaintenance  {...props} />;
      case 'messages':    return <OwnerMessages     {...props} onRead={() => setUnreadCount(0)} />;
      default:            return <OwnerHome         {...props} onNavigate={setActivePage} />;
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar
        navItems={NAV_ITEMS}
        activePage={activePage}
        onNavigate={setActivePage}
        unreadCount={unreadCount}
      />
      <main className="main-content">
        {renderPage()}
      </main>
      <Toast
        show={toast.show}
        message={toast.message}
        icon={toast.icon}
        onClose={() => setToast(t => ({ ...t, show: false }))}
      />
    </div>
  );
}
