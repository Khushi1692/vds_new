import React, { useState, useEffect, useCallback } from 'react';
import AdminLogin from './components/AdminLogin';
import AdminOverview from './components/AdminOverview';
import AdminOrders from './components/AdminOrders';
import AdminCompanies from './components/AdminCompanies';
import AdminQuotes from './components/AdminQuotes';
import AdminInvoiceModal from './components/AdminInvoiceModal';
import PrintInvoiceModal from './components/PrintInvoiceModal';
import './AdminPortal.css';

import { 
  Building2, Package, AlertTriangle, FileText, CheckCircle2, 
  DollarSign, RefreshCw, LogOut, ShieldAlert, Store, Clock, 
  MessageSquare, ChevronRight, Search
} from 'lucide-react';

export default function AdminPortal() {
  const [adminToken, setAdminToken] = useState(
    localStorage.getItem('vds_admin_token') || ''
  );
  const [adminUser, setAdminUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('vds_admin_user') || 'null');
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'orders', 'companies', 'quotes'
  const [ordersFilter, setOrdersFilter] = useState('all');

  // Data states
  const [overviewData, setOverviewData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Modals
  const [selectedOrderForManage, setSelectedOrderForManage] = useState(null);
  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState(null);

  // Live Melbourne Time Clock
  const [melbourneTime, setMelbourneTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const str = now.toLocaleDateString('en-AU', {
        timeZone: 'Australia/Melbourne',
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }) + ' · ' + now.toLocaleTimeString('en-AU', {
        timeZone: 'Australia/Melbourne',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }).toUpperCase() + ' AEST';
      setMelbourneTime(str);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Verify and load operations data
  const loadPortalData = useCallback(async (token) => {
    if (!token) return;
    setLoading(true);
    setError('');

    try {
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Verify token
      const verifyRes = await fetch('http://localhost:3001/api/admin/verify', { headers });
      if (!verifyRes.ok) {
        throw new Error('Administrative session expired. Please sign in again.');
      }

      // 2. Fetch all operations collections in parallel
      const [overviewRes, ordersRes, companiesRes, quotesRes] = await Promise.all([
        fetch('http://localhost:3001/api/admin/overview', { headers }),
        fetch('http://localhost:3001/api/admin/orders', { headers }),
        fetch('http://localhost:3001/api/admin/companies', { headers }),
        fetch('http://localhost:3001/api/admin/quotes', { headers })
      ]);

      if (overviewRes.ok) {
        const oData = await overviewRes.json();
        setOverviewData(oData);
      }
      if (ordersRes.ok) {
        const ordData = await ordersRes.json();
        setOrders(ordData);
      }
      if (companiesRes.ok) {
        const compData = await companiesRes.json();
        setCompanies(compData);
      }
      if (quotesRes.ok) {
        const qData = await quotesRes.json();
        setQuotes(qData);
      }
    } catch (err) {
      setError(err.message);
      // Auto logout if token invalid
      if (err.message.includes('session expired') || err.message.includes('401') || err.message.includes('403')) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (adminToken) {
      loadPortalData(adminToken);
    }
  }, [adminToken, loadPortalData]);

  const handleLoginSuccess = (user, token) => {
    setAdminUser(user);
    setAdminToken(token);
    loadPortalData(token);
  };

  const handleLogout = () => {
    localStorage.removeItem('vds_admin_token');
    localStorage.removeItem('vds_admin_user');
    setAdminToken('');
    setAdminUser(null);
  };

  const handleOrderUpdated = (updatedOrder) => {
    setOrders((prev) => 
      prev.map(o => o.orderId === updatedOrder.orderId ? updatedOrder : o)
    );
    if (selectedOrderForManage && selectedOrderForManage.orderId === updatedOrder.orderId) {
      setSelectedOrderForManage(updatedOrder);
    }
    // Refresh overview data in background
    if (adminToken) {
      fetch('http://localhost:3001/api/admin/overview', {
        headers: { Authorization: `Bearer ${adminToken}` }
      })
      .then(res => res.json())
      .then(data => setOverviewData(data))
      .catch(console.error);
    }
  };

  const navigateTabWithFilter = (tab, filter = 'all') => {
    setActiveTab(tab);
    if (filter) setOrdersFilter(filter);
  };

  // If not logged in as admin, render secure login
  if (!adminToken || !adminUser) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  const pendingInvoicesCount = overviewData?.metrics?.pendingInvoices || 0;
  const pendingQuotesCount = overviewData?.metrics?.pendingQuotes || 0;

  return (
    <div className="admin-portal-root">
      {/* Top Administrative Header Bar */}
      <header className="admin-top-nav">
        <div className="nav-left">
          <div className="brand-badge-row">
            <div className="vds-cube-icon">
              <Building2 size={20} />
            </div>
            <div className="brand-text">
              <span className="brand-title">Victoria Diagnostic Supplies</span>
              <span className="ops-tag">OPERATIONS CONSOLE</span>
            </div>
          </div>
          <div className="melbourne-clock-pill">
            <span className="live-dot" />
            <Clock size={13} />
            <span>{melbourneTime}</span>
          </div>
        </div>

        <div className="nav-right">
          <button 
            type="button" 
            className="header-refresh-btn"
            onClick={() => loadPortalData(adminToken)}
            disabled={loading}
            title="Refresh All Operations Data"
          >
            <RefreshCw size={15} className={loading ? 'spinning' : ''} />
            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <div className="staff-profile-chip">
            <div className="staff-avatar">
              {adminUser.name?.charAt(0) || 'A'}
            </div>
            <div className="staff-info">
              <span className="staff-name">{adminUser.name || 'Operations Staff'}</span>
              <span className="staff-role">{adminUser.email}</span>
            </div>
          </div>

          <button
            type="button"
            className="staff-logout-btn"
            onClick={handleLogout}
            title="Exit Admin Console"
          >
            <LogOut size={16} />
            <span>Exit Portal</span>
          </button>
        </div>
      </header>

      {/* Navigation Tabs Bar */}
      <nav className="admin-tabs-bar">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <span>Dashboard Overview</span>
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          <span>Orders & Invoices</span>
          {pendingInvoicesCount > 0 && (
            <span className="tab-badge amber" title={`${pendingInvoicesCount} orders need delivery fee & invoice`}>
              {pendingInvoicesCount}
            </span>
          )}
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === 'companies' ? 'active' : ''}`}
          onClick={() => setActiveTab('companies')}
        >
          <span>Companies & Stores</span>
          <span className="tab-badge neutral">{companies.length}</span>
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === 'quotes' ? 'active' : ''}`}
          onClick={() => setActiveTab('quotes')}
        >
          <span>Quote Requests</span>
          {pendingQuotesCount > 0 && (
            <span className="tab-badge blue">{pendingQuotesCount}</span>
          )}
        </button>
      </nav>

      {/* Main Content Workspace */}
      <main className="admin-portal-content">
        {error && (
          <div className="admin-portal-error-alert">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {activeTab === 'overview' && (
          <AdminOverview
            metrics={overviewData?.metrics}
            recentOrders={orders}
            recentQuotes={quotes}
            onSelectOrder={(order) => setSelectedOrderForManage(order)}
            onNavigateTab={navigateTabWithFilter}
            onRefresh={() => loadPortalData(adminToken)}
          />
        )}

        {activeTab === 'orders' && (
          <AdminOrders
            orders={orders}
            initialFilter={ordersFilter}
            onSelectOrder={(order) => setSelectedOrderForManage(order)}
            onOpenPrint={(order) => setSelectedOrderForPrint(order)}
          />
        )}

        {activeTab === 'companies' && (
          <AdminCompanies
            companies={companies}
            token={adminToken}
            onRefresh={() => loadPortalData(adminToken)}
          />
        )}

        {activeTab === 'quotes' && (
          <AdminQuotes
            quotes={quotes}
            token={adminToken}
            onRefresh={() => loadPortalData(adminToken)}
          />
        )}
      </main>

      {/* Slide-over / Modal: Manage Order & Issue Invoice */}
      {selectedOrderForManage && (
        <AdminInvoiceModal
          order={selectedOrderForManage}
          token={adminToken}
          onClose={() => setSelectedOrderForManage(null)}
          onOrderUpdated={handleOrderUpdated}
          onOpenPrint={(order) => {
            setSelectedOrderForManage(null);
            setSelectedOrderForPrint(order);
          }}
        />
      )}

      {/* Printable ATO Tax Invoice Modal */}
      {selectedOrderForPrint && (
        <PrintInvoiceModal
          order={selectedOrderForPrint}
          onClose={() => setSelectedOrderForPrint(null)}
        />
      )}
    </div>
  );
}
