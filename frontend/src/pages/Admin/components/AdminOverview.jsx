import React, { useState } from 'react';
import { 
  DollarSign, Package, AlertTriangle, FileText, CheckCircle2, 
  Building2, Store, Clock, ArrowRight, RefreshCw, MessageSquare,
  CreditCard, Activity, ExternalLink, ShieldCheck
} from 'lucide-react';
import { getApiUrl } from '../../../config/api';

export default function AdminOverview({ 
  metrics, 
  recentOrders, 
  recentQuotes, 
  onSelectOrder, 
  onNavigateTab,
  onRefresh,
  token
}) {
  const [stripeStatus, setStripeStatus] = useState(null);

  const handleTestStripe = async () => {
    setStripeStatus({ loading: true });
    try {
      const res = await fetch(getApiUrl('/api/admin/stripe-test'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Stripe test failed');
      setStripeStatus({ loading: false, success: true, data });
    } catch (err) {
      setStripeStatus({ loading: false, success: false, error: err.message });
    }
  };

  if (!metrics) {
    return (
      <div className="admin-loading-state">
        <RefreshCw size={24} className="spinning-icon" />
        <p>Loading Operations Overview...</p>
      </div>
    );
  }

  return (
    <div className="admin-overview-tab">
      {/* KPI Cards Grid */}
      <div className="metrics-grid">
        {/* Metric 1: Pending Invoices (Action Required) */}
        <div 
          className="metric-card alert-amber clickable"
          onClick={() => onNavigateTab('orders', 'pending_invoice')}
        >
          <div className="metric-icon-wrap amber">
            <AlertTriangle size={24} />
          </div>
          <div className="metric-body">
            <span className="metric-label">Needs Delivery Fee & Invoice</span>
            <div className="metric-val">{metrics.pendingInvoices}</div>
            <span className="metric-hint">Pending B2B Invoice Requests</span>
          </div>
        </div>

        {/* Metric 2: Total Orders */}
        <div 
          className="metric-card clickable"
          onClick={() => onNavigateTab('orders', 'all')}
        >
          <div className="metric-icon-wrap blue">
            <Package size={24} />
          </div>
          <div className="metric-body">
            <span className="metric-label">Total B2B Orders</span>
            <div className="metric-val">{metrics.totalOrders}</div>
            <span className="metric-hint">Lifetime order count</span>
          </div>
        </div>

        {/* Metric 3: Total Subtotal Volume */}
        <div className="metric-card">
          <div className="metric-icon-wrap green">
            <DollarSign size={24} />
          </div>
          <div className="metric-body">
            <span className="metric-label">Order Volume (Ex GST)</span>
            <div className="metric-val">${(metrics.totalSubtotalExGst || 0).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <span className="metric-hint">Catalog catalog merchandise total</span>
          </div>
        </div>

        {/* Metric 4: Companies & Stores */}
        <div 
          className="metric-card clickable"
          onClick={() => onNavigateTab('companies')}
        >
          <div className="metric-icon-wrap purple">
            <Building2 size={24} />
          </div>
          <div className="metric-body">
            <span className="metric-label">Trade Partners & Stores</span>
            <div className="metric-val">{metrics.totalCompanies} <small>companies</small> / {metrics.totalStores} <small>stores</small></div>
            <span className="metric-hint">Registered multi-store practices</span>
          </div>
        </div>

        {/* Metric 5: Invoices Issued & Paid */}
        <div 
          className="metric-card clickable"
          onClick={() => onNavigateTab('orders', 'paid')}
        >
          <div className="metric-icon-wrap teal">
            <CheckCircle2 size={24} />
          </div>
          <div className="metric-body">
            <span className="metric-label">Settled / Paid Orders</span>
            <div className="metric-val">{metrics.paidOrders}</div>
            <span className="metric-hint">Invoices settled via EFT / card</span>
          </div>
        </div>

        {/* Metric 6: Pending Quotes */}
        <div 
          className="metric-card clickable"
          onClick={() => onNavigateTab('quotes')}
        >
          <div className="metric-icon-wrap cyan">
            <MessageSquare size={24} />
          </div>
          <div className="metric-body">
            <span className="metric-label">Pending Quote Requests</span>
            <div className="metric-val">{metrics.pendingQuotes}</div>
            <span className="metric-hint">Commercial quotes awaiting review</span>
          </div>
        </div>
      </div>

      {/* Two Column Section: Action Needed & Recent Activity */}
      <div className="overview-split-grid">
        {/* Left Column: Action Required Stream */}
        <div className="overview-panel">
          <div className="panel-header">
            <div className="header-title">
              <AlertTriangle size={18} className="amber-text" />
              <h3>Orders Requiring Final Tax Invoice ({metrics.pendingInvoices})</h3>
            </div>
            <button 
              type="button" 
              className="view-all-link"
              onClick={() => onNavigateTab('orders', 'pending_invoice')}
            >
              View All <ArrowRight size={14} />
            </button>
          </div>

          <div className="action-items-list">
            {recentOrders
              .filter(o => !o.orderStatus || o.orderStatus === 'pending_invoice')
              .slice(0, 5)
              .map((order) => (
                <div key={order.orderId} className="action-item-card">
                  <div className="item-meta">
                    <span className="order-num">{order.orderId}</span>
                    <span className="order-time">
                      <Clock size={12} />
                      {new Date(order.createdAt).toLocaleDateString('en-AU')}
                    </span>
                    <span className="client-name">
                      {order.companyName || order.customerName}
                    </span>
                  </div>

                  <div className="item-store">
                    <Store size={13} />
                    <span>{order.store?.name || 'Main Store'} ({order.store?.address || 'No address'})</span>
                  </div>

                  <div className="item-action-row">
                    <div className="subtotal-ex">
                      Subtotal: <strong>${(order.subtotalExGst || (order.totalAmount / 100)).toFixed(2)} Ex GST</strong>
                    </div>
                    <button
                      type="button"
                      className="calc-freight-btn"
                      onClick={() => onSelectOrder(order)}
                    >
                      Calculate Delivery & Issue Invoice
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              ))}

            {recentOrders.filter(o => !o.orderStatus || o.orderStatus === 'pending_invoice').length === 0 && (
              <div className="empty-action-box">
                <CheckCircle2 size={32} className="green-text" />
                <p>All current orders have finalized tax invoices and delivery charges!</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recent Activity Feed */}
        <div className="overview-panel">
          <div className="panel-header">
            <div className="header-title">
              <Clock size={18} />
              <h3>Recent Order Activity</h3>
            </div>
            <button 
              type="button" 
              className="refresh-btn"
              onClick={onRefresh}
              title="Refresh Analytics"
            >
              <RefreshCw size={14} />
              <span>Refresh</span>
            </button>
          </div>

          <div className="activity-list">
            {recentOrders.slice(0, 6).map((order) => {
              const status = order.orderStatus || 'pending_invoice';
              return (
                <div 
                  key={order.orderId} 
                  className="activity-row clickable"
                  onClick={() => onSelectOrder(order)}
                >
                  <div className="activity-left">
                    <div className="activity-id">{order.orderId}</div>
                    <div className="activity-client">
                      {order.companyName || order.customerName}
                    </div>
                  </div>

                  <div className="activity-right">
                    <span className={`status-pill ${status}`}>
                      {status.replace('_', ' ')}
                    </span>
                    <span className="activity-amount">
                      ${(order.finalInvoiceTotal || order.subtotalExGst || (order.totalAmount / 100)).toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stripe Gateway Live Diagnostic Card */}
      <div style={{
        marginTop: '24px',
        background: '#0d1627',
        border: '1px solid #1e293b',
        borderRadius: '12px',
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: 'rgba(99, 91, 255, 0.15)',
              color: '#818cf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <CreditCard size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h4 style={{ margin: 0, fontSize: '15px', color: '#f1f5f9', fontWeight: 600 }}>Stripe Gateway Live Credentials</h4>
                <span style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  letterSpacing: '0.02em'
                }}>
                  ● LIVE MODE
                </span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: '#94a3b8' }}>
                Restricted key <code>rk_live_...</code> and publishable key <code>pk_live_...</code> are configured. Verify connection without charging money.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleTestStripe}
            disabled={stripeStatus?.loading}
            style={{
              background: '#635bff',
              border: 'none',
              color: '#ffffff',
              padding: '10px 18px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: stripeStatus?.loading ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.15s ease'
            }}
          >
            {stripeStatus?.loading ? <RefreshCw size={15} className="spinning-icon" /> : <Activity size={15} />}
            {stripeStatus?.loading ? 'Running Diagnostic...' : 'Test Stripe Connection (No Charge)'}
          </button>
        </div>

        {stripeStatus && stripeStatus.success && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '8px',
            padding: '14px 18px',
            fontSize: '13px',
            color: '#e2e8f0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: 600, marginBottom: '8px' }}>
              <CheckCircle2 size={16} />
              <span>Stripe Live Credentials Verified & Working!</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', fontSize: '12.5px', color: '#94a3b8' }}>
              <div><strong>Created Session ID:</strong> <code style={{ color: '#38bdf8' }}>{stripeStatus.data.sessionId}</code></div>
              <div><strong>Mode:</strong> <span style={{ color: '#10b981', fontWeight: 600 }}>Live Mode</span></div>
              <div><strong>Payment Status:</strong> <span style={{ color: '#f1f5f9' }}>Unpaid ($0 charged)</span></div>
              <div><strong>Timestamp:</strong> <span>{new Date(stripeStatus.data.timestamp).toLocaleTimeString('en-AU')}</span></div>
            </div>
            <div style={{ marginTop: '10px', fontSize: '12px', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <span>A live verification call was recorded in your Stripe Dashboard under <strong>Developers &rarr; Logs</strong>.</span>
              {stripeStatus.data.sessionUrl && (
                <a
                  href={stripeStatus.data.sessionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#38bdf8', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}
                >
                  Preview Stripe Hosted Checkout <ExternalLink size={12} />
                </a>
              )}
            </div>
          </div>
        )}

        {stripeStatus && stripeStatus.error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            padding: '12px 16px',
            fontSize: '13px',
            color: '#f87171'
          }}>
            <strong>Stripe Diagnostic Error:</strong> {stripeStatus.error}
          </div>
        )}
      </div>
    </div>
  );
}
