import React from 'react';
import { 
  X, Store, MapPin, Phone, Building2, FileText, 
  AlertCircle, CheckCircle2, Clock, Truck, Printer, CreditCard 
} from 'lucide-react';
import './OrderDetailsModal.css';

export default function OrderDetailsModal({ 
  isOpen, 
  order, 
  productsMap, 
  token,
  onClose, 
  onOpenPayModal,
  onOpenPrintModal
}) {
  if (!isOpen || !order) return null;

  const orderStatus = order.orderStatus || 'pending_invoice';
  const isInvoiceIssued = orderStatus === 'invoice_issued';
  const isPaid = orderStatus === 'paid' || order.paymentStatus === 'paid';
  const isDispatched = orderStatus === 'dispatched';
  const isDelivered = orderStatus === 'delivered';
  const isCancelled = orderStatus === 'cancelled';

  const subtotalExGst = order.subtotalExGst != null 
    ? order.subtotalExGst 
    : (order.totalAmount / 100);
  
  const delivery = order.deliveryCharge || 0;
  const hasDelivery = order.deliveryCharge !== undefined && order.deliveryCharge > 0;
  const taxable = subtotalExGst + delivery;
  const gstAmount = order.gstAmount != null 
    ? order.gstAmount 
    : parseFloat((taxable * 0.10).toFixed(2));
  const finalInvoiceTotal = order.finalInvoiceTotal != null 
    ? order.finalInvoiceTotal 
    : parseFloat((taxable + gstAmount).toFixed(2));

  // Status mapping
  const getStatusBadge = () => {
    switch (orderStatus) {
      case 'invoice_issued':
        return { label: 'TAX INVOICE ISSUED - PAYMENT DUE', color: '#38bdf8', bg: 'rgba(2, 132, 199, 0.15)', border: 'rgba(2, 132, 199, 0.35)' };
      case 'paid':
        return { label: 'PAID & CONFIRMED', color: '#4ade80', bg: 'rgba(34, 197, 94, 0.15)', border: 'rgba(34, 197, 94, 0.35)' };
      case 'dispatched':
        return { label: 'DISPATCHED', color: '#c084fc', bg: 'rgba(168, 85, 247, 0.15)', border: 'rgba(168, 85, 247, 0.35)' };
      case 'delivered':
        return { label: 'DELIVERED', color: '#2dd4bf', bg: 'rgba(20, 184, 166, 0.15)', border: 'rgba(20, 184, 166, 0.35)' };
      case 'cancelled':
        return { label: 'CANCELLED', color: '#f87171', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.35)' };
      default:
        return { label: 'INVOICE REQUESTED', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.15)', border: 'rgba(251, 191, 36, 0.35)' };
    }
  };

  const badge = getStatusBadge();

  return (
    <div className="odm-overlay" onClick={onClose}>
      <div className="odm-content" onClick={e => e.stopPropagation()}>
        <button className="odm-close" onClick={onClose}>
          <X size={20} />
        </button>
        
        {/* Title Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <div>
            <h2 className="odm-title">
              {order.orderId || `ORD-${order._id.slice(-8).toUpperCase()}`}
            </h2>
            {order.invoiceNumber && (
              <div style={{ fontSize: '0.8rem', color: '#38bdf8', marginTop: '2px', fontWeight: 600 }}>
                Official Invoice #: {order.invoiceNumber}
              </div>
            )}
          </div>
          <span style={{ 
            fontSize: '0.75rem', 
            padding: '5px 12px',
            borderRadius: '9999px',
            fontWeight: 700,
            color: badge.color,
            background: badge.bg,
            border: `1px solid ${badge.border}`,
            letterSpacing: '0.04em'
          }}>
            {badge.label}
          </span>
        </div>

        {/* Status Notification Banner */}
        {orderStatus === 'pending_invoice' && (
          <div className="odm-status-banner pending_invoice">
            <Clock size={18} style={{ flexShrink: 0, marginTop: '2px', color: '#fbbf24' }} />
            <div>
              <strong>Invoice Under Review:</strong> Our dispatch team is currently calculating the consolidated delivery fee to {order.store?.name || 'your store'}. Once calculated, your official Tax Invoice and instant "Pay Now" link will appear here.
            </div>
          </div>
        )}

        {orderStatus === 'invoice_issued' && (
          <div className="odm-status-banner invoice_issued">
            <CreditCard size={18} style={{ flexShrink: 0, marginTop: '2px', color: '#38bdf8' }} />
            <div>
              <strong>Tax Invoice Issued:</strong> Your delivery charge of <strong>${delivery.toFixed(2)} AUD</strong> has been consolidated. Total amount payable is <strong>${finalInvoiceTotal.toFixed(2)} AUD</strong>. You can now settle online via Stripe or EFT transfer.
            </div>
          </div>
        )}

        {isPaid && (
          <div className="odm-status-banner paid">
            <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '2px', color: '#4ade80' }} />
            <div>
              <strong>Payment Confirmed:</strong> Your tax invoice is marked as fully PAID. Your supplies are queued in our Melbourne warehouse for dispatch.
            </div>
          </div>
        )}

        {isDispatched && (
          <div className="odm-status-banner dispatched">
            <Truck size={18} style={{ flexShrink: 0, marginTop: '2px', color: '#c084fc' }} />
            <div>
              <strong>Dispatched via Courier:</strong> Order has departed our distribution hub for delivery to {order.store?.name || 'your clinic'}.
              {order.adminNotes && (
                <div style={{ marginTop: '4px', fontSize: '0.8rem', fontStyle: 'italic' }}>
                  Courier Note: {order.adminNotes}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Store & Company Info Box */}
        {(order.store || order.companyName || order.poNumber) && (
          <div className="odm-store-box">
            {order.companyName && (
              <div><strong style={{ color: '#ffffff' }}>Trade Account:</strong> {order.companyName} {order.companyAbn ? `(ABN: ${order.companyAbn})` : ''}</div>
            )}
            {order.store?.name && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                <Store size={14} color="#38bdf8" />
                <strong style={{ color: '#ffffff' }}>Receiving Store:</strong> {order.store.name}
              </div>
            )}
            {order.store?.address && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', marginTop: '2px' }}>
                <MapPin size={14} color="#38bdf8" />
                <span>{order.store.address}</span>
              </div>
            )}
            {order.store?.contactNumber && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', marginTop: '2px' }}>
                <Phone size={14} color="#38bdf8" />
                <span>{order.store.contactNumber}</span>
              </div>
            )}
            {order.poNumber && (
              <div style={{ marginTop: '4px' }}>
                <strong style={{ color: '#ffffff' }}>Purchase Order (PO) #:</strong> <span style={{ color: '#38bdf8', fontWeight: 600 }}>{order.poNumber}</span>
              </div>
            )}
          </div>
        )}
        
        {/* Items List */}
        <div className="odm-items">
          {order.items && order.items.map((item, idx) => {
            const productInfo = (productsMap && productsMap[item.productId]) || { name: item.name || 'Product', image: '' };
            const itemPrice = item.price != null ? item.price : (productInfo.price || 0);
            const subtotal = (itemPrice * item.quantity).toFixed(2);
            
            return (
              <div key={idx} className="odm-item">
                <div className="odm-item-img-wrapper">
                  {productInfo.image ? (
                    <img src={productInfo.image} alt={productInfo.name || item.name} />
                  ) : (
                    <div className="odm-item-placeholder">No Image</div>
                  )}
                </div>
                <div className="odm-item-info">
                  <div className="odm-item-name">{item.name || productInfo.name || `Product ID: ${item.productId}`}</div>
                  <div className="odm-item-price">
                    ${subtotal} ({item.quantity} × ${itemPrice.toFixed(2)} Ex GST)
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {order.specialInstructions && (
          <div style={{ margin: '10px 0 16px', fontSize: '0.85rem', color: '#94a3b8' }}>
            <strong style={{ color: '#ffffff' }}>Delivery Notes:</strong> {order.specialInstructions}
          </div>
        )}
        
        {/* Financial Breakdown */}
        <div className="odm-breakdown">
          <div className="odm-breakdown-row">
            <span>Items Subtotal (Ex GST):</span>
            <strong style={{ color: '#ffffff' }}>${subtotalExGst.toFixed(2)} AUD</strong>
          </div>

          {orderStatus === 'pending_invoice' ? (
            <div className="odm-breakdown-row" style={{ color: '#fbbf24', fontStyle: 'italic' }}>
              <span>Consolidated Courier Delivery Fee:</span>
              <span>Calculated on Official Invoice</span>
            </div>
          ) : (
            <div className="odm-breakdown-row freight">
              <span>Consolidated Delivery Charge (Ex GST):</span>
              <strong>+${delivery.toFixed(2)} AUD</strong>
            </div>
          )}

          {orderStatus !== 'pending_invoice' && (
            <div className="odm-breakdown-row taxable">
              <span>Net Taxable Amount:</span>
              <strong>${taxable.toFixed(2)} AUD</strong>
            </div>
          )}

          <div className="odm-breakdown-row">
            <span>Goods & Services Tax (10% GST):</span>
            <span>+${gstAmount.toFixed(2)} AUD</span>
          </div>

          <div className="odm-breakdown-row total">
            <span>
              {orderStatus === 'pending_invoice' 
                ? 'Estimated Items Subtotal (Inc GST):' 
                : isPaid 
                  ? 'Total Paid (Inc GST):' 
                  : 'FINAL INVOICE TOTAL DUE:'}
            </span>
            <strong>${finalInvoiceTotal.toFixed(2)} AUD</strong>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="odm-actions-bar">
          {/* PAY NOW option when invoice is issued and awaiting payment */}
          {isInvoiceIssued && (
            <button
              type="button"
              className="odm-pay-btn"
              onClick={() => {
                if (onOpenPayModal) onOpenPayModal(order);
              }}
            >
              <CreditCard size={18} />
              <span>Pay Now (${finalInvoiceTotal.toFixed(2)} AUD)</span>
            </button>
          )}

          {/* PRINT / VIEW TAX INVOICE button */}
          {orderStatus !== 'pending_invoice' && (
            <button
              type="button"
              className="odm-print-btn"
              onClick={() => {
                if (onOpenPrintModal) onOpenPrintModal(order);
              }}
            >
              <Printer size={16} />
              <span>{isPaid ? 'Print Tax Invoice (Paid Receipt)' : 'View / Print Tax Invoice'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
