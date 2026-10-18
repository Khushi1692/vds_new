import React, { useState } from 'react';
import { 
  X, CheckCircle2, AlertCircle, Truck, DollarSign, Send, 
  Printer, Building2, Store, FileText, Phone, Mail, MapPin, 
  Clock, ShieldAlert, Save, RefreshCw
} from 'lucide-react';

export default function AdminInvoiceModal({ 
  order, 
  token, 
  onClose, 
  onOrderUpdated, 
  onOpenPrint 
}) {
  const [deliveryCharge, setDeliveryCharge] = useState(
    order.deliveryCharge !== undefined ? order.deliveryCharge : ''
  );
  const [orderStatus, setOrderStatus] = useState(order.orderStatus || 'pending_invoice');
  const [paymentStatus, setPaymentStatus] = useState(order.paymentStatus || 'pending_invoice');
  const [poNumber, setPoNumber] = useState(order.poNumber || '');
  const [adminNotes, setAdminNotes] = useState(order.adminNotes || '');
  const [invoiceNotes, setInvoiceNotes] = useState('');
  
  // Store editing
  const [storeName, setStoreName] = useState(order.store?.name || '');
  const [storeAddress, setStoreAddress] = useState(order.store?.address || '');
  const [storePhone, setStorePhone] = useState(order.store?.contactNumber || '');
  const [isEditingStore, setIsEditingStore] = useState(false);

  const [saving, setSaving] = useState(false);
  const [submittingInvoice, setSubmittingInvoice] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Real-time calculations
  const subtotalExGst = order.subtotalExGst || (order.totalAmount ? order.totalAmount / 100 : 0);
  const parsedDelivery = Math.max(0, parseFloat(deliveryCharge) || 0);
  const taxableAmount = subtotalExGst + parsedDelivery;
  const calculatedGst = parseFloat((taxableAmount * 0.10).toFixed(2));
  const finalTotalIncGst = parseFloat((taxableAmount + calculatedGst).toFixed(2));

  // Quick preset delivery charges for staff convenience
  const setQuickFreight = (amount) => {
    setDeliveryCharge(amount);
  };

  // 1. Save standard order modifications (PUT)
  const handleSaveChanges = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setFeedback({ type: '', message: '' });

    try {
      const res = await fetch(`http://localhost:3001/api/admin/orders/${order.orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          deliveryCharge: parsedDelivery,
          orderStatus,
          paymentStatus,
          adminNotes,
          poNumber,
          store: {
            name: storeName,
            address: storeAddress,
            contactNumber: storePhone
          }
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update order');

      setFeedback({ type: 'success', message: 'Order changes and delivery charge saved successfully.' });
      onOrderUpdated(data.order);
      setIsEditingStore(false);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Error updating order' });
    } finally {
      setSaving(false);
    }
  };

  // Quick One-Click Status Update
  const handleQuickStatus = async (newStatus) => {
    setOrderStatus(newStatus);
    setSaving(true);
    setFeedback({ type: '', message: '' });

    try {
      const res = await fetch(`http://localhost:3001/api/admin/orders/${order.orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          deliveryCharge: parsedDelivery,
          orderStatus: newStatus,
          paymentStatus: newStatus === 'paid' ? 'paid' : paymentStatus,
          adminNotes,
          poNumber,
          store: {
            name: storeName,
            address: storeAddress,
            contactNumber: storePhone
          }
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update order status');

      setFeedback({ 
        type: 'success', 
        message: `Order status successfully transitioned to ${newStatus.replace('_', ' ').toUpperCase()}!` 
      });
      onOrderUpdated(data.order);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Error updating order' });
    } finally {
      setSaving(false);
    }
  };

  // 2. Submit & Finalize Invoice (POST)
  const handleSubmitFinalInvoice = async () => {
    if (parsedDelivery === 0 && deliveryCharge === '') {
      if (!window.confirm('No delivery charge was entered ($0.00). Do you want to submit with FREE delivery?')) {
        return;
      }
    }

    setSubmittingInvoice(true);
    setFeedback({ type: '', message: '' });

    try {
      const res = await fetch(`http://localhost:3001/api/admin/orders/${order.orderId}/submit-invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          deliveryCharge: parsedDelivery,
          adminNotes,
          invoiceNotes
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit invoice');

      setOrderStatus('invoice_issued');
      setFeedback({ 
        type: 'success', 
        message: data.message || 'Tax Invoice successfully issued and emailed to the customer!' 
      });
      onOrderUpdated(data.order);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to issue tax invoice' });
    } finally {
      setSubmittingInvoice(false);
    }
  };

  return (
    <div className="admin-modal-overlay">
      <div className="order-manage-modal">
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
            </div>
          </div>
          <button type="button" className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback.message && (
          <div className={`modal-feedback-alert ${feedback.type}`}>
            {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{feedback.message}</span>
          </div>
        )}

        <div className="manage-modal-body">
          {/* Section 1: Customer, Company & Delivery Store */}
          <div className="manage-grid-2col">
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
          </div>

          {/* Customer Special Instructions & PO */}
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

          {/* Section 2: Order Items */}
          <div className="order-items-box">
            <div className="box-header">
              <FileText size={16} />
              <span>Requested Products ({order.items?.length || 0} items)</span>
              <span className="ex-gst-tag">All catalog prices exclude GST</span>
            </div>
            <table className="manage-items-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th className="text-center">Qty</th>
                  <th className="text-right">Unit Price (Ex GST)</th>
                  <th className="text-right">Line Total (Ex GST)</th>
                </tr>
              </thead>
              <tbody>
                {(order.items || []).map((item, i) => (
                  <tr key={i}>
                    <td>
                      <strong>{item.name}</strong>
                    </td>
                    <td className="sku-cell">{item.sku || 'N/A'}</td>
                    <td className="text-center">{item.quantity}</td>
                    <td className="text-right">${item.price ? item.price.toFixed(2) : '0.00'}</td>
                    <td className="text-right font-bold">
                      ${item.price ? (item.price * item.quantity).toFixed(2) : '0.00'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Section 3: Delivery Charge & Real-Time Invoice Calculation */}
          <div className="freight-calculation-card">
            <div className="freight-header">
              <div className="title-left">
                <Truck size={20} className="icon-truck" />
                <div>
                  <h3>Consolidated Order Delivery Charge</h3>
                  <p>Single freight fee calculated once for the entire order to the selected store location.</p>
                </div>
              </div>
              <div className="quick-presets">
                <span className="preset-label">Quick Presets:</span>
                <button type="button" onClick={() => setQuickFreight(15)}>Metro ($15)</button>
                <button type="button" onClick={() => setQuickFreight(25)}>Regional ($25)</button>
                <button type="button" onClick={() => setQuickFreight(35)}>Heavy/Bulky ($35)</button>
                <button type="button" onClick={() => setQuickFreight(0)}>Free ($0)</button>
              </div>
            </div>

            <div className="freight-input-row">
              <label htmlFor="deliveryFeeInput">
                <span>Enter Consolidated Delivery Charge (AUD Ex GST):</span>
              </label>
              <div className="delivery-input-box">
                <span className="currency-prefix">$</span>
                <input
                  id="deliveryFeeInput"
                  type="number"
                  step="0.01"
                  min="0"
                  value={deliveryCharge}
                  onChange={(e) => setDeliveryCharge(e.target.value)}
                  placeholder="0.00"
                />
                <span className="currency-suffix">AUD (Ex GST)</span>
              </div>
            </div>

            {/* Live Calculation Panel */}
            <div className="live-invoice-breakdown">
              <div className="calc-row">
                <span>Products Subtotal (Ex GST):</span>
                <strong>${subtotalExGst.toFixed(2)} AUD</strong>
              </div>
              <div className="calc-row">
                <span>Consolidated Delivery Charge (Ex GST):</span>
                <span className="freight-highlight">+ ${parsedDelivery.toFixed(2)} AUD</span>
              </div>
              <div className="calc-row taxable">
                <span>Net Taxable Subtotal (Ex GST):</span>
                <strong>${taxableAmount.toFixed(2)} AUD</strong>
              </div>
              <div className="calc-row">
                <span>Goods & Services Tax (10% GST):</span>
                <span className="gst-val">+ ${calculatedGst.toFixed(2)} AUD</span>
              </div>
              <div className="calc-row grand-total">
                <span>FINAL INVOICE TOTAL (Inc GST):</span>
                <span className="total-val">${finalTotalIncGst.toFixed(2)} AUD</span>
              </div>
            </div>
          </div>

          {/* Section 4: Operational Workflow & Status Updates */}
          <div className="workflow-panel-grid">
            <div className="status-control-box">
              <label>Update Order Status</label>
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

              {/* Quick Status Action Badges */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
                {orderStatus !== 'paid' && (
                  <button 
                    type="button" 
                    onClick={() => handleQuickStatus('paid')} 
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: '1px solid rgba(34, 197, 94, 0.4)',
                      background: 'rgba(34, 197, 94, 0.15)',
                      color: '#4ade80'
                    }}
                    disabled={saving}
                    title="Mark order as Paid immediately"
                  >
                    <CheckCircle2 size={12} />
                    <span>Set Paid</span>
                  </button>
                )}
                {orderStatus !== 'dispatched' && orderStatus !== 'delivered' && (
                  <button 
                    type="button" 
                    onClick={() => handleQuickStatus('dispatched')} 
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: '1px solid rgba(168, 85, 247, 0.4)',
                      background: 'rgba(168, 85, 247, 0.15)',
                      color: '#c084fc'
                    }}
                    disabled={saving}
                    title="Mark order as Dispatched"
                  >
                    <Truck size={12} />
                    <span>Set Dispatched</span>
                  </button>
                )}
                {orderStatus !== 'delivered' && (
                  <button 
                    type="button" 
                    onClick={() => handleQuickStatus('delivered')} 
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: '1px solid rgba(20, 184, 166, 0.4)',
                      background: 'rgba(20, 184, 166, 0.15)',
                      color: '#2dd4bf'
                    }}
                    disabled={saving}
                    title="Mark order as Delivered"
                  >
                    <CheckCircle2 size={12} />
                    <span>Set Delivered</span>
                  </button>
                )}
              </div>

              <label style={{ marginTop: '14px' }}>Update PO Number</label>
              <input
                type="text"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                placeholder="e.g. PO-MELB-9842"
                className="admin-input"
              />
            </div>

            <div className="notes-control-box">
              <label>Internal Staff Notes (Private)</label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Courier tracking #, customer phone call notes, delivery instructions..."
                rows={3}
                className="admin-textarea"
              />

              <label style={{ marginTop: '10px' }}>Dispatch / Invoice Notes (Visible to Customer)</label>
              <input
                type="text"
                value={invoiceNotes}
                onChange={(e) => setInvoiceNotes(e.target.value)}
                placeholder="e.g. Dispatched via StarTrack Express on Mon morning"
                className="admin-input"
              />
            </div>
          </div>
        </div>

        {/* Modal Bottom Action Bar */}
        <div className="manage-modal-footer">
          <div className="footer-left">
            <button
              type="button"
              className="action-btn outline"
              onClick={() => onOpenPrint(order)}
            >
              <Printer size={16} />
              <span>Print Tax Invoice</span>
            </button>
            <button
              type="button"
              className="action-btn outline"
              onClick={handleSaveChanges}
              disabled={saving}
            >
              <Save size={16} />
              <span>{saving ? 'Updating...' : 'Update Status & Details'}</span>
            </button>
          </div>

          <div className="footer-right">
            <button
              type="button"
              className="action-btn cancel"
              onClick={onClose}
            >
              Close
            </button>
            <button
              type="button"
              className="action-btn submit-invoice"
              onClick={handleSubmitFinalInvoice}
              disabled={submittingInvoice}
            >
              <Send size={16} />
              <span>
                {submittingInvoice 
                  ? 'Finalizing & Sending...' 
                  : orderStatus === 'invoice_issued'
                    ? 'Re-Issue & Email Official Tax Invoice'
                    : 'Submit & Issue Official Final Tax Invoice'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
