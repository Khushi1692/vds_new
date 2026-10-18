import React, { useState } from 'react';
import { 
  X, CreditCard, Building2, CheckCircle2, AlertCircle, 
  Copy, Check, ShieldCheck, ArrowRight, Loader2, Sparkles, Send
} from 'lucide-react';
import './ClientPaymentModal.css';

export default function ClientPaymentModal({ 
  order, 
  token, 
  onClose, 
  onPaymentSuccess 
}) {
  if (!order) return null;

  const [activeTab, setActiveTab] = useState('card'); // 'card' or 'eft'
  const [loadingStripe, setLoadingStripe] = useState(false);
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [loadingEft, setLoadingEft] = useState(false);
  const [copiedField, setCopiedField] = useState('');
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // EFT form
  const [remittanceRef, setRemittanceRef] = useState('');
  const [bankName, setBankName] = useState('');
  const [notes, setNotes] = useState('');

  // Financials
  const invoiceNum = order.invoiceNumber || `INV-${order.orderId}`;
  const subtotal = order.subtotalExGst || (order.totalAmount ? order.totalAmount / 100 : 0);
  const delivery = order.deliveryCharge || 0;
  const taxable = subtotal + delivery;
  const gst = order.gstAmount || parseFloat((taxable * 0.10).toFixed(2));
  const finalTotal = order.finalInvoiceTotal || parseFloat((taxable + gst).toFixed(2));

  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(''), 2500);
  };

  // 1. Stripe Card Checkout
  const handlePayWithStripe = async () => {
    setLoadingStripe(true);
    setFeedback({ type: '', message: '' });

    try {
      const res = await fetch(`/api/orders/${order.orderId}/create-payment-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initiate Stripe session');

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received from gateway');
      }
    } catch (err) {
      setFeedback({ 
        type: 'error', 
        message: err.message || 'Payment gateway connection error. Please try direct EFT transfer or contact support.' 
      });
      setLoadingStripe(false);
    }
  };

  // 2. Direct Instant Payment Verification (Instant Simulation / Test Mode)
  const handleInstantPayment = async () => {
    setLoadingVerify(true);
    setFeedback({ type: '', message: '' });

    try {
      const simSessionId = `sim_card_${Date.now()}`;
      const res = await fetch(`/api/orders/${order.orderId}/verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ sessionId: simSessionId })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to complete payment');

      setFeedback({ 
        type: 'success', 
        message: 'Payment confirmed successfully! Tax invoice marked as PAID.' 
      });

      if (onPaymentSuccess) {
        setTimeout(() => {
          onPaymentSuccess(data.order);
        }, 1200);
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Payment processing failed' });
    } finally {
      setLoadingVerify(false);
    }
  };

  // 3. Submit EFT Remittance Advice
  const handleSubmitRemittance = async (e) => {
    e.preventDefault();
    setLoadingEft(true);
    setFeedback({ type: '', message: '' });

    try {
      const res = await fetch(`/api/orders/${order.orderId}/remittance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          referenceNumber: remittanceRef || `EFT-${invoiceNum}`,
          bankName: bankName || 'Direct Transfer',
          notes: notes
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit EFT remittance');

      setFeedback({ 
        type: 'success', 
        message: 'EFT payment confirmed and remittance logged! Status updated to PAID.' 
      });

      if (onPaymentSuccess) {
        setTimeout(() => {
          onPaymentSuccess(data.order);
        }, 1200);
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to submit remittance' });
    } finally {
      setLoadingEft(false);
    }
  };

  return (
    <div className="cpm-overlay" onClick={onClose}>
      <div className="cpm-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="cpm-header">
          <div className="cpm-header-left">
            <div className="cpm-icon-wrap">
              <CreditCard size={22} />
            </div>
            <div>
              <h3 className="cpm-title">Pay Tax Invoice</h3>
              <div className="cpm-subtitle">
                Official Invoice: <strong>{invoiceNum}</strong> · Order: {order.orderId}
              </div>
            </div>
          </div>
          <button type="button" className="cpm-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="cpm-body">
          {/* Feedback Alert */}
          {feedback.message && (
            <div className={`cpm-alert ${feedback.type}`}>
              {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Breakdown Card */}
          <div className="cpm-summary-card">
            <div className="cpm-summary-title">
              <span>Invoice Breakdown</span>
              <span>{order.store?.name || 'Clinic Destination'}</span>
            </div>
            <div className="cpm-summary-rows">
              <div className="cpm-row">
                <span>Items Subtotal ({order.items?.length || 0} line items Ex GST):</span>
                <strong>${subtotal.toFixed(2)} AUD</strong>
              </div>
              <div className="cpm-row freight">
                <span>Consolidated Delivery Charge (Single Fee Ex GST):</span>
                <strong>+${delivery.toFixed(2)} AUD</strong>
              </div>
              <div className="cpm-row taxable">
                <span>Net Taxable Subtotal:</span>
                <strong>${taxable.toFixed(2)} AUD</strong>
              </div>
              <div className="cpm-row">
                <span>Goods & Services Tax (10% GST):</span>
                <strong>+${gst.toFixed(2)} AUD</strong>
              </div>
              <div className="cpm-row total">
                <span>Total Amount Due:</span>
                <span className="total-amount">${finalTotal.toFixed(2)} AUD</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="cpm-tabs">
            <button
              type="button"
              className={`cpm-tab-btn ${activeTab === 'card' ? 'active' : ''}`}
              onClick={() => setActiveTab('card')}
            >
              <CreditCard size={16} />
              <span>Credit / Debit Card (Stripe)</span>
            </button>
            <button
              type="button"
              className={`cpm-tab-btn ${activeTab === 'eft' ? 'active' : ''}`}
              onClick={() => setActiveTab('eft')}
            >
              <Building2 size={16} />
              <span>Direct Bank EFT (NAB)</span>
            </button>
          </div>

          {/* Tab 1: Card */}
          {activeTab === 'card' && (
            <div className="cpm-card-tab">
              <div className="cpm-stripe-badge">
                <ShieldCheck size={14} />
                <span>256-Bit Encrypted Stripe Payment Gateway</span>
              </div>

              <div className="cpm-card-info">
                <CreditCard size={28} color="#38bdf8" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>Instant Card Settlement:</strong> Pay via Visa, MasterCard, American Express, Apple Pay, or Google Pay. Your payment status will be updated immediately upon authorization.
                </div>
              </div>

              <button
                type="button"
                className="cpm-pay-stripe-btn"
                onClick={handlePayWithStripe}
                disabled={loadingStripe || loadingVerify}
              >
                {loadingStripe ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Connecting to Stripe...</span>
                  </>
                ) : (
                  <>
                    <span>Pay ${finalTotal.toFixed(2)} AUD with Card</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              {/* Instant Verification Demo button */}
              <button
                type="button"
                className="cpm-fast-verify-btn"
                onClick={handleInstantPayment}
                disabled={loadingStripe || loadingVerify}
                title="Instant Card Approval Simulation"
              >
                {loadingVerify ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Processing Instant Approval...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Instant Card Settlement (Development / Fast Checkout)</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Tab 2: EFT */}
          {activeTab === 'eft' && (
            <form className="cpm-eft-tab" onSubmit={handleSubmitRemittance}>
              <div className="cpm-bank-details-box">
                <div className="cpm-bank-row">
                  <span>Bank:</span>
                  <strong style={{ color: '#ffffff' }}>National Australia Bank (NAB)</strong>
                </div>
                <div className="cpm-bank-row">
                  <span>Account Name:</span>
                  <strong style={{ color: '#ffffff' }}>Victoria Diagnostic Supplies Pty Ltd</strong>
                </div>
                <div className="cpm-bank-row">
                  <span>BSB Number:</span>
                  <div className="cpm-copyable-val">
                    <span>083-004</span>
                    <button
                      type="button"
                      className="cpm-copy-icon-btn"
                      onClick={() => copyToClipboard('083-004', 'bsb')}
                      title="Copy BSB"
                    >
                      {copiedField === 'bsb' ? <Check size={14} color="#4ade80" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
                <div className="cpm-bank-row">
                  <span>Account Number:</span>
                  <div className="cpm-copyable-val">
                    <span>8492 1045</span>
                    <button
                      type="button"
                      className="cpm-copy-icon-btn"
                      onClick={() => copyToClipboard('84921045', 'acc')}
                      title="Copy Account Number"
                    >
                      {copiedField === 'acc' ? <Check size={14} color="#4ade80" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
                <div className="cpm-bank-row" style={{ borderTop: '1px dashed #1e293b', paddingTop: '8px' }}>
                  <span style={{ color: '#38bdf8', fontWeight: 600 }}>Payment Reference:</span>
                  <div className="cpm-copyable-val">
                    <span style={{ color: '#38bdf8' }}>{invoiceNum}</span>
                    <button
                      type="button"
                      className="cpm-copy-icon-btn"
                      onClick={() => copyToClipboard(invoiceNum, 'ref')}
                      title="Copy Payment Reference"
                    >
                      {copiedField === 'ref' ? <Check size={14} color="#4ade80" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="cpm-form-group">
                <label>Your Bank Transfer / Transaction Reference (Optional)</label>
                <input
                  type="text"
                  className="cpm-input"
                  value={remittanceRef}
                  onChange={(e) => setRemittanceRef(e.target.value)}
                  placeholder={`e.g. NAB-${invoiceNum}`}
                />
              </div>

              <div className="cpm-form-group">
                <label>Transfer Notes / Remittance Details</label>
                <input
                  type="text"
                  className="cpm-input"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Paid from practice operational account on Monday"
                />
              </div>

              <button
                type="submit"
                className="cpm-submit-remittance-btn"
                disabled={loadingEft}
              >
                {loadingEft ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Confirming Remittance...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Confirm EFT Remittance Paid</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
