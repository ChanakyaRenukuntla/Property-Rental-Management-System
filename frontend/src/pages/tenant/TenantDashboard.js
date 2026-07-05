// src/pages/tenant/TenantDashboard.js

import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/common/Sidebar';
import Toast   from '../../components/common/Toast';
import { messageAPI } from '../../services/api';

import TenantHome        from './TenantHome';
import TenantProperties  from './TenantProperties';
import TenantPayments    from './TenantPayments';
import TenantMaintenance from './TenantMaintenance';
import TenantMessages    from './TenantMessages';
import TenantMapSearch   from './TenantMapSearch';
import TenantRequests    from './TenantRequests';

const NAV_ITEMS = [
  { key: 'home',        icon: '🏠', label: 'My Home'     },
  { key: 'properties',  icon: '🔍', label: 'All Properties' },
  { key: 'mapsearch',   icon: '🗺️', label: 'Map Search'    },
  { key: 'requests',    icon: '📨', label: 'My Requests'   },
  { key: 'payments',    icon: '💳', label: 'Payments'    },
  { key: 'maintenance', icon: '🔧', label: 'Maintenance' },
  { key: 'messages',    icon: '💬', label: 'Messages'    },
];

export default function TenantDashboard() {
  const [activePage,  setActivePage]  = useState('home');
  const [toast,       setToast]       = useState({ show: false, message: '', icon: '✅' });
  const [unreadCount, setUnreadCount] = useState(0);

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

  const renderPage = () => {
    const props = { showToast };
    switch (activePage) {
      case 'home':        return <TenantHome        {...props} onNavigate={setActivePage} />;
      case 'properties':  return <TenantProperties  {...props} />;
      case 'mapsearch':   return <TenantMapSearch    {...props} />;
      case 'requests':    return <TenantRequests     {...props} onNavigate={setActivePage} />;
      case 'payments':    return <TenantPayments     {...props} />;
      case 'maintenance': return <TenantMaintenance  {...props} />;
      case 'messages':    return <TenantMessages     {...props} onRead={() => setUnreadCount(0)} />;
      default:            return <TenantHome         {...props} onNavigate={setActivePage} />;
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
