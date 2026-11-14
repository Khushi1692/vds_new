import React, { useState, useEffect } from 'react';
import { 
  X, CheckCircle2, AlertCircle, Building2, Store, Clock, 
  RefreshCw, Check, Truck
} from 'lucide-react';
import AdminOrderSummaryCard from './AdminOrderSummaryCard';
import { getApiUrl } from '../../../config/api';

export default function AdminInvoiceModal({ 
  order, 
  token, 
  onClose, 
  onOrderUpdated, 
  onOpenPrint 
}) {
  const [orderStatus, setOrderStatus] = useState(order.orderStatus || 'pending_invoice');
  const [paymentStatus, setPaymentStatus] = useState(order.paymentStatus || 'pending_invoice');
  const [poNumber, setPoNumber] = useState(order.poNumber || '');
  const [adminNotes, setAdminNotes] = useState(order.adminNotes || '');
  const [invoiceNotes, setInvoiceNotes] = useState('');

  // Store editing
  const [storeName, setStoreName] = useState(order.store?.name || '');
  const [storeAddress, setStoreAddress] = useState(order.store?.address || '');
  const [storePhone, setStorePhone] = useState(order.store?.contactNumber || '');
  const [storeEmail, setStoreEmail] = useState(order.store?.email || '');
  const [isEditingStore, setIsEditingStore] = useState(false);

  // Sync state if order prop changes
  useEffect(() => {
    if (order) {
      setOrderStatus(order.orderStatus || 'pending_invoice');
      setPaymentStatus(order.paymentStatus || 'pending_invoice');
      setPoNumber(order.poNumber || '');
      setAdminNotes(order.adminNotes || '');
      setStoreName(order.store?.name || '');
      setStoreAddress(order.store?.address || '');
      setStorePhone(order.store?.contactNumber || '');
      setStoreEmail(order.store?.email || '');
    }
  }, [order]);

  const handleQuickStatus = async (newStatus) => {
    setOrderStatus(newStatus);
    try {
      const res = await fetch(getApiUrl(`/api/admin/orders/${order.orderId}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          orderStatus: newStatus,
          paymentStatus: newStatus === 'paid' ? 'paid' : paymentStatus,
          adminNotes,
          poNumber,
          store: {
            name: storeName,
            address: storeAddress,
            contactNumber: storePhone,
            email: storeEmail
          }
        })
      });
      const data = await res.json();
      if (res.ok && onOrderUpdated) {
        onOrderUpdated(data.order);
      }
    } catch (err) {
      console.error('Quick status update error:', err);
    }
  };

  return (
    <div className="admin-modal-overlay">
      <div className="order-manage-modal admin-modal-wide">
        {/* Modal Top Bar */}
        <div className="manage-modal-header">
          <div className="header-meta">
            <span className="order-tag">Order Management & Invoice Hub</span>
            <h2>{order.orderId}</h2>
            <div className="meta-chips">
              <span className={`status-chip ${orderStatus}`}>
                {orderStatus.replace('_', ' ').toUpperCase()}
              </span>
              <span className="date-chip">
                <Clock size={13} />
                {new Date(order.createdAt).toLocaleString('en-AU')}
              </span>
              {order.companyName && (
                <span className="date-chip" style={{ color: '#38bdf8' }}>
                  <Building2 size={12} />
                  {order.companyName}
                </span>
              )}
            </div>
          </div>
          <button type="button" className="close-btn" onClick={onClose} title="Close window">
            <X size={20} />
          </button>
        </div>

        {/* Modal Body - 2 Column Split Grid */}
        <div className="manage-modal-body modal-split-view">
          {/* Left Column (Primary): The Exact Order Summary Card with Editable Pricing */}
          <div className="modal-col-summary">
            <AdminOrderSummaryCard
              order={order}
              token={token}
              onOrderUpdated={onOrderUpdated}
              onOpenPrint={onOpenPrint}
              extraPayload={{
                orderStatus,
                paymentStatus,
                adminNotes,
                poNumber,
                invoiceNotes,
                store: {
                  name: storeName,
                  address: storeAddress,
                  contactNumber: storePhone,
                  email: storeEmail
                }
              }}
            />
          </div>

          {/* Right Column: Customer Details, Store Location & Workflow Controls */}
          <div className="modal-col-details">
            {/* Customer & Company Details */}
            <div className="info-card">
              <div className="card-title">
                <Building2 size={16} />
                <span>Trade Client & Company</span>
              </div>
              <div className="info-rows">
                <div className="info-row">
                  <span className="lbl">Company Name:</span>
                  <span className="val highlight">{order.companyName || 'Not specified'}</span>
                </div>
                <div className="info-row">
                  <span className="lbl">Company ABN:</span>
                  <span className="val">{order.companyAbn || 'Not provided'}</span>
                </div>
                <div className="info-row">
                  <span className="lbl">Contact Person:</span>
                  <span className="val">{order.customerName}</span>
                </div>
                <div className="info-row">
                  <span className="lbl">Email:</span>
                  <span className="val link">{order.customerEmail}</span>
                </div>
                <div className="info-row">
                  <span className="lbl">Phone:</span>
                  <span className="val">{order.customerPhone || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Delivery Destination Store */}
            <div className="info-card">
              <div className="card-title">
                <Store size={16} />
                <span>Delivery Destination Store</span>
                {!isEditingStore && (
                  <button 
                    type="button" 
                    className="edit-subtle-btn"
                    onClick={() => setIsEditingStore(true)}
                  >
                    Edit Address
                  </button>
                )}
              </div>

              {!isEditingStore ? (
                <div className="info-rows">
                  <div className="info-row">
                    <span className="lbl">Store / Branch:</span>
                    <span className="val highlight">{storeName || 'Main Practice'}</span>
                  </div>
                  <div className="info-row">
                    <span className="lbl">Delivery Address:</span>
                    <span className="val">{storeAddress || 'Not specified'}</span>
                  </div>
                  <div className="info-row">
                    <span className="lbl">Store Phone:</span>
                    <span className="val">{storePhone || 'N/A'}</span>
                  </div>
                  {storeEmail && (
                    <div className="info-row">
                      <span className="lbl">Store Email:</span>
                      <span className="val">{storeEmail}</span>
                    </div>
                  )}
                  {order.poNumber && (
                    <div className="info-row">
                      <span className="lbl">PO Number:</span>
                      <span className="val po-badge">{order.poNumber}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="store-edit-form">
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="Store / Practice Name"
                  />
                  <input
                    type="text"
                    value={storeAddress}
                    onChange={(e) => setStoreAddress(e.target.value)}
                    placeholder="Full Delivery Address"
                  />
                  <input
                    type="text"
                    value={storePhone}
                    onChange={(e) => setStorePhone(e.target.value)}
                    placeholder="Store Contact Phone"
                  />
                  <input
                    type="email"
                    value={storeEmail}
                    onChange={(e) => setStoreEmail(e.target.value)}
                    placeholder="Store Email Address"
                  />
                  <button 
                    type="button" 
                    className="done-editing-btn"
                    onClick={() => setIsEditingStore(false)}
                  >
                    Done Editing
                  </button>
                </div>
              )}
            </div>

            {/* Special Instructions & PO Banner */}
            {(order.specialInstructions || order.poNumber) && (
              <div className="instructions-banner">
                {order.poNumber && (
                  <div className="inst-item">
                    <strong>Customer PO #:</strong> <span>{order.poNumber}</span>
                  </div>
                )}
                {order.specialInstructions && (
                  <div className="inst-item">
                    <strong>Delivery Notes:</strong> <span>{order.specialInstructions}</span>
                  </div>
                )}
              </div>
            )}

            {/* Workflow & Status Controls */}
            <div className="info-card">
              <div className="card-title">
                <Truck size={16} />
                <span>Order Status & Tracking</span>
              </div>
              <div className="status-control-box" style={{ padding: 0 }}>
                <label>Order Status</label>
                <select 
                  value={orderStatus} 
                  onChange={(e) => setOrderStatus(e.target.value)}
                  className="admin-select"
                >
                  <option value="pending_invoice">Pending Invoice (Needs Delivery Fee)</option>
                  <option value="invoice_issued">Invoice Issued (Awaiting Payment)</option>
                  <option value="paid">Paid (Payment Received via EFT)</option>
                  <option value="dispatched">Dispatched (Shipped with Courier)</option>
                  <option value="delivered">Delivered (Completed)</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                {/* Quick Status Buttons */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
                  {orderStatus !== 'paid' && (
                    <button 
                      type="button" 
                      onClick={() => handleQuickStatus('paid')} 
                      className="quick-status-btn paid"
                    >
                      <CheckCircle2 size={12} />
                      <span>Set Paid</span>
                    </button>
                  )}
                  {orderStatus !== 'dispatched' && orderStatus !== 'delivered' && (
                    <button 
                      type="button" 
                      onClick={() => handleQuickStatus('dispatched')} 
                      className="quick-status-btn dispatched"
                    >
                      <Truck size={12} />
                      <span>Set Dispatched</span>
                    </button>
                  )}
                </div>

                <label style={{ marginTop: '14px' }}>Customer PO #</label>
                <input
                  type="text"
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  placeholder="e.g. PO-MELB-9842"
                  className="admin-input"
                />

                <label style={{ marginTop: '12px' }}>Internal Staff Notes (Private)</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Private staff notes, courier consignment #..."
                  rows={2}
                  className="admin-textarea"
                />

                <label style={{ marginTop: '10px' }}>Invoice Notes (Customer Visible)</label>
                <input
                  type="text"
                  value={invoiceNotes}
                  onChange={(e) => setInvoiceNotes(e.target.value)}
                  placeholder="e.g. Dispatched via StarTrack Express"
                  className="admin-input"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Bar */}
        <div className="manage-modal-footer">
          <button
            type="button"
            className="action-btn cancel"
            onClick={onClose}
            style={{ marginLeft: 'auto' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
