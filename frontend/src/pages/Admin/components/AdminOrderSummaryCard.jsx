import React, { useState, useEffect } from 'react';
import { 
  Package, DollarSign, Truck, Save, Printer, Send, 
  RotateCcw, CheckCircle2, AlertCircle, RefreshCw, Tag
} from 'lucide-react';
import { getApiUrl } from '../../../config/api';

export default function AdminOrderSummaryCard({
  order,
  token,
  onOrderUpdated,
  onOpenPrint,
  extraPayload = {}
}) {
  const [items, setItems] = useState(() =>
    (order.items || []).map(item => ({
      _id: item._id,
      productId: item.productId || item.id || item._id,
      name: item.name || 'Medical Product',
      sku: item.sku || '',
      image: item.image || '',
      quantity: item.quantity || 1,
      price: item.price !== undefined && item.price !== null ? (parseFloat(item.price) || 0) : 0,
      originalPrice: item.originalPrice !== undefined && item.originalPrice !== null 
        ? (parseFloat(item.originalPrice) || 0) 
        : (item.catalogPrice !== undefined ? parseFloat(item.catalogPrice) : (parseFloat(item.price) || 0))
    }))
  );

  const [deliveryCharge, setDeliveryCharge] = useState(
    order.deliveryCharge !== undefined ? order.deliveryCharge : ''
  );
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Sync state if order prop changes
  useEffect(() => {
    if (order && order.items && Array.isArray(order.items)) {
      setItems(order.items.map(item => ({
        _id: item._id,
        productId: item.productId || item.id || item._id,
        name: item.name || 'Medical Product',
        sku: item.sku || '',
        image: item.image || '',
        quantity: item.quantity || 1,
        price: item.price !== undefined && item.price !== null ? (parseFloat(item.price) || 0) : 0,
        originalPrice: item.originalPrice !== undefined && item.originalPrice !== null 
          ? (parseFloat(item.originalPrice) || 0) 
          : (item.catalogPrice !== undefined ? parseFloat(item.catalogPrice) : (parseFloat(item.price) || 0))
      })));
      setDeliveryCharge(order.deliveryCharge !== undefined ? order.deliveryCharge : '');
    }
  }, [order]);

  // Real-time financial calculations
  const subtotal = items.reduce((sum, item) => {
    const p = parseFloat(item.price) || 0;
    const q = item.quantity || 1;
    return sum + (p * q);
  }, 0);
  const parsedDelivery = Math.max(0, parseFloat(deliveryCharge) || 0);
  const taxableAmount = subtotal + parsedDelivery;
  const estimatedGst = parseFloat((taxableAmount * 0.10).toFixed(2));
  const finalTotalIncGst = parseFloat((taxableAmount + estimatedGst).toFixed(2));

  // Edit item price without stripping decimals while typing
  const handlePriceChange = (index, val) => {
    const cleaned = val.replace(/[$, ]/g, '');
    if (cleaned !== '' && !/^\d*\.?\d*$/.test(cleaned)) {
      return;
    }
    setItems(prev => {
      const next = [...prev];
      next[index] = { ...next[index], price: cleaned };
      return next;
    });
  };

  const handlePriceBlur = (index) => {
    setItems(prev => {
      const next = [...prev];
      const parsed = parseFloat(next[index].price);
      next[index] = {
        ...next[index],
        price: isNaN(parsed) ? 0 : parseFloat(parsed.toFixed(2))
      };
      return next;
    });
  };

  const handleQtyChange = (index, val) => {
    const parsed = parseInt(val, 10);
    setItems(prev => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        quantity: isNaN(parsed) || parsed < 1 ? 1 : parsed
      };
      return next;
    });
  };

  const handleResetPrice = (index) => {
    setItems(prev => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        price: next[index].originalPrice !== undefined ? next[index].originalPrice : 0
      };
      return next;
    });
  };

  const getSanitizedItems = () => {
    return items.map(it => ({
      _id: it._id,
      productId: it.productId || it.id || (it._id ? String(it._id) : 'PROD'),
      name: it.name || 'Medical Product',
      sku: it.sku || '',
      image: it.image || '',
      quantity: Math.max(1, parseInt(it.quantity, 10) || 1),
      price: Math.max(0, parseFloat(it.price) || 0)
    }));
  };

  // 1. Save modified prices & delivery charge (PUT)
  const handleSave = async () => {
    setSaving(true);
    setFeedback({ type: '', message: '' });

    try {
      const res = await fetch(getApiUrl(`/api/admin/orders/${order.orderId}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          deliveryCharge: parsedDelivery,
          items: getSanitizedItems(),
          ...extraPayload
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update order');

      setFeedback({ 
        type: 'success', 
        message: `Order #${order.invoiceNumber || order.orderId} updated! Custom Subtotal: $${(data.order?.subtotalExGst || subtotal).toFixed(2)}, Final Total: $${(data.order?.finalInvoiceTotal || finalTotalIncGst).toFixed(2)} AUD` 
      });
      if (onOrderUpdated) onOrderUpdated(data.order);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Error updating prices' });
    } finally {
      setSaving(false);
    }
  };

  // 2. Finalize & Email Official Tax Invoice (POST)
  const handleFinalizeInvoice = async () => {
    setSubmitting(true);
    setFeedback({ type: '', message: '' });

    try {
      const res = await fetch(getApiUrl(`/api/admin/orders/${order.orderId}/submit-invoice`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          deliveryCharge: parsedDelivery,
          items: getSanitizedItems(),
          ...extraPayload
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to finalize invoice');

      setFeedback({ 
        type: 'success', 
        message: data.message || `Official Tax Invoice #${data.order?.invoiceNumber || order.orderId} finalized with custom prices and emailed to customer!` 
      });
      if (onOrderUpdated) onOrderUpdated(data.order);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Error issuing invoice' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-order-summary-card">
      {/* Header matching exact Checkout Order Summary Card */}
      <div className="admin-summary-header">
        <div className="admin-summary-title-row">
          <h2 className="admin-summary-title">Order Summary ({items.length} Lines)</h2>
          <span className="admin-edit-badge">
            <Tag size={12} />
            <span>Admin Editable Pricing</span>
          </span>
        </div>
        <p className="admin-summary-subtitle">
          Adjust item prices or quantities below specifically for this client's invoice. Subtotal and GST update in real time.
        </p>
      </div>

      {/* Feedback Alert */}
      {feedback.message && (
        <div className={`admin-summary-alert ${feedback.type}`}>
          {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Items List matching Checkout Item Rows */}
      <div className="admin-summary-items-list">
        {items.length === 0 ? (
          <div className="admin-summary-empty">
            <Package size={32} opacity={0.4} />
            <p>No products attached to this order.</p>
          </div>
        ) : (
          items.map((item, idx) => {
            const numPrice = typeof item.price === 'number' ? item.price : (parseFloat(item.price) || 0);
            const origPrice = Number(item.originalPrice) || 0;
            const isModified = Math.abs(numPrice - origPrice) > 0.001;

            return (
              <div key={idx} className={`admin-summary-item-row ${isModified ? 'is-modified' : ''}`}>
                {/* Product thumbnail in white square background */}
                <div className="admin-item-img-box">
                  {item.image ? (
                    <img 
                      src={item.image.replace(/\.(png|jpe?g)$/i, '.webp')} 
                      alt={item.name} 
                      loading="lazy" 
                    />
                  ) : (
                    <Package size={24} color="#64748b" />
                  )}
                </div>

                {/* Product meta: Name, Qty, SKU */}
                <div className="admin-item-meta">
                  <div className="admin-item-name" title={item.name}>
                    {item.name}
                  </div>
                  <div className="admin-item-qty-row">
                    <span className="admin-qty-label">Qty:</span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={item.quantity}
                      onChange={(e) => handleQtyChange(idx, e.target.value)}
                      className="admin-qty-mini-input"
                      title="Adjust quantity for this invoice"
                    />
                    <span className="admin-sku-divider">·</span>
                    <span className="admin-item-sku">{item.sku || 'N/A'}</span>
                  </div>
                  {isModified && (
                    <div className="admin-price-diff-pill">
                      <span>Adjusted from ${origPrice.toFixed(2)}</span>
                      <button
                        type="button"
                        className="admin-price-reset-btn"
                        onClick={() => handleResetPrice(idx)}
                        title="Reset back to catalog price"
                      >
                        <RotateCcw size={11} />
                        <span>Reset</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Editable Price Column */}
                <div className="admin-item-price-col">
                  <div className="admin-price-input-group">
                    <span className="currency-sign">$</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={item.price === undefined || item.price === null ? '' : item.price}
                      onChange={(e) => handlePriceChange(idx, e.target.value)}
                      onBlur={() => handlePriceBlur(idx)}
                      className="admin-price-input"
                      placeholder="0.00"
                      title="Click to edit unit price (Ex GST) for this client"
                    />
                    <span className="ex-gst-label">ex GST</span>
                  </div>
                  <div className="admin-item-line-total">
                    = ${(numPrice * (item.quantity || 1)).toFixed(2)} AUD
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Calculations Breakdown matching exact Checkout Card */}
      <div className="admin-summary-breakdown">
        {/* Subtotal */}
        <div className="admin-calc-row">
          <span>Subtotal (Excl. GST & Delivery)</span>
          <strong className="calc-amount">${subtotal.toFixed(2)}</strong>
        </div>

        {/* 10% GST */}
        <div className="admin-calc-row">
          <span>
            Estimated GST (10%)
            <span className="admin-calc-tag blue">Itemised on Invoice</span>
          </span>
          <span className="calc-amount cyan">+${estimatedGst.toFixed(2)}</span>
        </div>

        {/* Consolidated Delivery Charge */}
        <div className="admin-delivery-calc-section">
          <div className="admin-calc-row delivery-header-row">
            <span>
              Delivery Charge (Entire Order)
              <span className="admin-calc-tag amber">Single Consolidated Fee</span>
            </span>
            <span className="calc-amount amber">
              {parsedDelivery > 0 ? `+$${parsedDelivery.toFixed(2)}` : '$0.00 (Free)'}
            </span>
          </div>

          {/* Quick Presets & Input */}
          <div className="admin-delivery-input-row">
            <div className="admin-delivery-presets">
              <button type="button" onClick={() => setDeliveryCharge(15)}>Metro ($15)</button>
              <button type="button" onClick={() => setDeliveryCharge(25)}>Regional ($25)</button>
              <button type="button" onClick={() => setDeliveryCharge(35)}>Bulky ($35)</button>
              <button type="button" onClick={() => setDeliveryCharge(0)}>Free ($0)</button>
            </div>
            <div className="admin-delivery-input-box">
              <span className="prefix">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={deliveryCharge}
                onChange={(e) => setDeliveryCharge(e.target.value)}
                placeholder="0.00"
              />
              <span className="suffix">ex GST</span>
            </div>
          </div>
        </div>

        {/* Final Invoice Total */}
        <div className="admin-calc-row grand-total-row">
          <span className="grand-label">FINAL INVOICE TOTAL (Inc GST)</span>
          <span className="grand-amount">${finalTotalIncGst.toFixed(2)} AUD</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="admin-summary-actions">
        <button
          type="button"
          className="admin-btn-save-invoice"
          onClick={handleSave}
          disabled={saving}
          title="Save custom item prices and recalculate invoice totals in database"
        >
          <Save size={16} />
          <span>{saving ? 'Updating Invoice...' : `Save & Update Invoice ($${finalTotalIncGst.toFixed(2)})`}</span>
        </button>

        <div className="admin-btn-secondary-row">
          {onOpenPrint && (
            <button
              type="button"
              className="admin-btn-outline"
              onClick={() => onOpenPrint(order)}
              title="Print Official ATO Tax Invoice"
            >
              <Printer size={15} />
              <span>Print Tax Invoice</span>
            </button>
          )}

          <button
            type="button"
            className="admin-btn-submit-invoice"
            onClick={handleFinalizeInvoice}
            disabled={submitting}
            title="Finalize invoice with custom prices and email to customer"
          >
            <Send size={15} />
            <span>{submitting ? 'Finalizing...' : 'Submit & Email Tax Invoice'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
