import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Package, Store, ShieldAlert, FileText } from 'lucide-react';
import Button from '../../components/Button/Button';
import './Success.css';

export default function Success() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const type = searchParams.get('type');
  const orderId = searchParams.get('orderId');
  const storeName = searchParams.get('store');

  const isQuote = type === 'quote';
  const isInvoice = type === 'invoice';

  return (
    <main className="success-page">
      <div className="container" style={{ textAlign: 'center', padding: '80px 20px', maxWidth: '640px', margin: '0 auto' }}>
        <CheckCircle2 size={68} style={{ color: '#4ade80', margin: '0 auto 20px' }} />
        
        <h1 style={{ fontFamily: 'var(--font-heading, "Archivo", sans-serif)', fontSize: '2.2rem', marginBottom: '12px' }}>
          {isInvoice 
            ? 'Final Tax Invoice Request Received!' 
            : isQuote 
              ? 'Quote Request Sent' 
              : 'Order Received!'}
        </h1>

        {isInvoice ? (
          <div>
            <p style={{ color: 'var(--ink-soft)', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '20px' }}>
              Thank you for placing your order. Your request for a <strong>Final Tax Invoice</strong> has been registered with our Melbourne dispatch team.
            </p>

            <div style={{ background: 'var(--card, #0b1a2e)', border: '1px solid var(--line)', borderRadius: '12px', padding: '20px', textAlign: 'left', marginBottom: '24px' }}>
              {orderId && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.95rem' }}>
                  <span style={{ color: 'var(--ink-soft)' }}>Order Reference:</span>
                  <strong style={{ color: 'var(--cyan)' }}>#{orderId}</strong>
                </div>
              )}

              {storeName && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.95rem' }}>
                  <span style={{ color: 'var(--ink-soft)' }}>Delivery Store:</span>
                  <strong style={{ color: 'var(--ink)' }}>{decodeURIComponent(storeName)}</strong>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                <span style={{ color: 'var(--ink-soft)' }}>Payment Status:</span>
                <span style={{ color: '#fbbf24', fontWeight: 600 }}>Final Tax Invoice Pending</span>
              </div>
            </div>

            <div style={{ background: 'rgba(28, 77, 128, 0.25)', border: '1px solid rgba(143, 179, 223, 0.35)', borderRadius: '10px', padding: '14px 18px', textAlign: 'left', fontSize: '0.9rem', color: 'var(--ink-soft)', lineHeight: 1.5, marginBottom: '32px' }}>
              <strong style={{ color: '#ffffff', display: 'block', marginBottom: '4px' }}>
                Next Steps for Your Order:
              </strong>
              Catalog prices were registered <strong>excluding GST and delivery charges</strong>. Our freight department is calculating the courier delivery fee specifically for your store location. An official <strong>Final Tax Invoice with GST and delivery charges itemised</strong> will be emailed directly to your accounts email.
            </div>
          </div>
        ) : isQuote ? (
          <p style={{ color: 'var(--ink-soft)', fontSize: '1.05rem', lineHeight: 1.6 }}>
            Thank you for your enquiry. We'll be in touch with your customized quote shortly.
          </p>
        ) : (
          <p style={{ color: 'var(--ink-soft)', fontSize: '1.05rem', lineHeight: 1.6 }}>
            Thank you for your purchase. Your order is being processed.
          </p>
        )}

        {sessionId && !isQuote && !isInvoice && (
          <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>Session ID: {sessionId}</p>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap', marginTop: '20px' }}>
          <Button as={Link} to="/orders" variant="secondary" icon={Package}>
            View in Orders
          </Button>
          <Button as={Link} to="/products" variant="primary" iconRight={ArrowRight}>
            Continue Shopping
          </Button>
        </div>
      </div>
    </main>
  );
}
