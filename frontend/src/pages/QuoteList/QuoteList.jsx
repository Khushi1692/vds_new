import { useContext, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { QuoteContext } from '../../context/QuoteContext';
import Button from '../../components/Button/Button';
import './QuoteList.css';

const ART = {
  gel: '<path d="M44 46h32v52a6 6 0 0 1-6 6H50a6 6 0 0 1-6-6z"/><path d="M48 46l3-8h18l3 8"/><path d="M55 38l2-12h6l2 12"/><circle class="accf" cx="60" cy="18" r="3.2" fill="#2563eb"/><path class="dim" d="M32 46v58M29 46h6M29 104h6"/><path class="acc" d="M48 70h24" stroke="#2563eb"/>',
  apron: '<path d="M40 32q20 8 40 0l6 14-4 56q-22 6-44 0l-4-56z"/><path d="M48 32q12-14 24 0"/><path class="acc" d="M37 66h46" stroke="#2563eb"/><path class="dim" d="M94 46v56M91 46h6M91 102h6"/>',
  uvc: '<rect x="30" y="20" width="60" height="84" rx="4"/><rect x="40" y="30" width="40" height="52" rx="2"/><path d="M60 36v28M55 64h10l-2 9h-6z"/><path class="acc" d="M46 34v44M74 34v44" stroke-dasharray="3 4" stroke="#2563eb"/><circle class="accf" cx="60" cy="94" r="3" fill="#2563eb"/>',
  warmer: '<rect x="24" y="48" width="72" height="40" rx="4"/><rect x="34" y="60" width="40" height="14" rx="2"/><path d="M74 67h10M30 67h4"/><rect x="80" y="54" width="10" height="6" rx="1"/><path class="warm" d="M40 40q4-7 8 0t8 0t8 0t8 0"/><path class="dim" d="M24 96h72M24 93v6M96 93v6"/>',
  mri: '<circle cx="48" cy="86" r="18"/><circle cx="48" cy="86" r="3"/><circle cx="88" cy="98" r="6"/><path d="M38 34l10 38h38v20"/><path d="M48 72l-4-26"/><path d="M60 72V56h24"/><rect class="acc" x="78" y="22" width="22" height="16" rx="2" stroke="#2563eb"/><text x="81.5" y="34.5" style="font-size: 10px; font-family: sans-serif;">MR</text>',
  gown: '<path d="M42 28l12-6q6 7 12 0l12 6 14 18-10 6-4-6 2 58H40l2-58-4 6-10-6z"/><path d="M54 22v16q6 4 12 0V22"/><path class="acc" d="M46 62h28" stroke="#2563eb"/>'
};

const renderSVG = (key) => (
  <svg viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true" dangerouslySetInnerHTML={{ __html: ART[key] || ART['gel'] }} style={{ width: '100%', height: '100%' }} />
);

export default function QuoteList() {
  const { quoteItems, removeFromQuote, updateQuantity, clearQuote } = useContext(QuoteContext);
  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleQuoteSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const facility = document.getElementById('practice').value;
      const phone = document.getElementById('phone').value;
      const message = document.getElementById('notes').value;

      const items = quoteItems.map(item => ({
        productId: item.product.id,
        quantity: item.quantity
      }));

      const res = await fetch('/api/quote/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, facility, phone, message, items })
      });

      if (!res.ok) throw new Error('Failed to send quote request');

      clearQuote();
      navigate('/success?type=quote');
    } catch (err) {
      console.error(err);
      alert('Failed to send quote request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (quoteItems.length === 0) {
    return (
      <main className="cart-page">
        <div className="container cart-empty">
          <h2>Your quote list is empty</h2>
          <p>Looks like you haven't added anything to your quote list yet.</p>
          <Button as={Link} to="/products" variant="primary" icon={ArrowLeft}>
            Browse the range
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="cart-page">
      <section className="cart-hero" style={{ padding: '60px 0', borderBottom: '1px solid var(--line)' }}>
        <div className="container">
          <div className="crumbs" style={{ display: 'flex', gap: '8px', marginBottom: '24px', fontSize: '13px', fontFamily: 'var(--font-family-mono)', color: 'var(--ink-soft)' }}>
            <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
            <span>/</span>
            <span style={{ color: 'var(--ink)' }}>Quote list</span>
          </div>
          <h1 className="cart-title" style={{ fontSize: '3.5rem', fontWeight: '700', marginBottom: '16px', letterSpacing: '-0.02em', color: 'var(--ink)' }}>Your quote list</h1>
          <p className="cart-lead" style={{ fontSize: '1.2rem', color: 'var(--ink-soft)', maxWidth: '600px', lineHeight: '1.6' }}>
            Adjust quantities, add your details, and we'll come back with pricing, pack units and documents.
          </p>
        </div>
      </section>

      <div className="container cart-inner" style={{ paddingTop: '40px', paddingBottom: '80px' }}>
        <div className="cart-content" style={{ display: 'grid', gridTemplateColumns: '1fr 480px', gap: '40px' }}>
          <div className="cart-items">
            {quoteItems.map((item) => (
              <div key={item.product.id} className="cart-item" style={{ display: 'flex', gap: '20px', padding: '24px 40px 24px 0', borderBottom: '1px dashed var(--line)', alignItems: 'center' }}>
                <div className="cart-item-icon" style={{ width: '60px', color: 'var(--ink)' }}>
                  {renderSVG(item.product.art || 'gel')}
                </div>
                <div className="cart-item-details" style={{ flex: 1 }}>
                  <span className="cart-item-name" style={{ display: 'block', fontWeight: '600', fontSize: '16px', marginBottom: '4px' }}>{item.product.name}</span>
                  <span className="cart-item-cat" style={{ fontSize: '13px', color: 'var(--ink-soft)' }}>{item.product.category || 'Imaging consumables'}</span>
                </div>
                <div className="cart-item-actions" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
                  <div className="cart-qty-selector" style={{ display: 'flex', border: '1px solid var(--line)', borderRadius: '4px', background: 'transparent' }}>
                  <button type="button" onClick={() => updateQuantity(item.product.id, item.quantity - 1)} style={{ background: 'none', border: 'none', padding: '8px 12px', cursor: 'pointer', color: 'var(--ink)' }}>-</button>
                    <span style={{ padding: '8px 4px', width: '32px', textAlign: 'center', fontSize: '14px', color: 'var(--ink)' }}>{item.quantity}</span>
                    <button type="button" onClick={() => updateQuantity(item.product.id, item.quantity + 1)} style={{ background: 'none', border: 'none', padding: '8px 12px', cursor: 'pointer', color: 'var(--ink)' }}>+</button>
                  </div>
                  <button type="button" className="cart-item-remove" onClick={() => removeFromQuote(item.product.id)} style={{ color: 'var(--cyan)', border: 'none', background: 'none', cursor: 'pointer', textDecoration: 'underline', fontSize: '14px' }}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
            <div className="cart-clear">
              <button onClick={clearQuote} className="clear-cart-btn">Empty Quote List</button>
            </div>
            
            <div className="cart-note" style={{ marginTop: '24px', fontSize: '13px', color: 'var(--ink-soft)' }}>
              Quantities are in pack units, which we confirm with your quote.
            </div>
          </div>

          <div className="cart-summary" style={{ background: 'var(--card)', padding: '32px', borderRadius: '12px', border: '1px solid var(--line)' }}>
            <form className="quote-form" onSubmit={handleQuoteSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label htmlFor="name" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--ink)' }}>Your name</label>
                  <input type="text" id="name" required style={{ padding: '12px', border: '1px solid var(--line)', borderRadius: '6px', width: '100%', background: 'transparent', color: 'var(--ink)' }} />
                </div>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label htmlFor="practice" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--ink)' }}>Practice or organisation</label>
                  <input type="text" id="practice" required style={{ padding: '12px', border: '1px solid var(--line)', borderRadius: '6px', width: '100%', background: 'transparent', color: 'var(--ink)' }} />
                </div>
              </div>
              
              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label htmlFor="email" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--ink)' }}>Work email</label>
                  <input type="email" id="email" required style={{ padding: '12px', border: '1px solid var(--line)', borderRadius: '6px', width: '100%', background: 'transparent', color: 'var(--ink)' }} />
                </div>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label htmlFor="phone" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--ink)' }}>Phone <span style={{ color: 'var(--ink-soft)', fontWeight: 'normal' }}>(optional)</span></label>
                  <input type="tel" id="phone" style={{ padding: '12px', border: '1px solid var(--line)', borderRadius: '6px', width: '100%', background: 'transparent', color: 'var(--ink)' }} />
                </div>
              </div>
              
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label htmlFor="notes" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--ink)' }}>Anything we should know?</label>
                <textarea id="notes" placeholder="Delivery sites, timing, the brand you use now..." rows="4" style={{ padding: '12px', border: '1px solid var(--line)', borderRadius: '6px', width: '100%', resize: 'vertical', background: 'transparent', color: 'var(--ink)' }}></textarea>
              </div>
              
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--ink)' }}>Attach an invoice or product list <span style={{ color: 'var(--ink-soft)', fontWeight: 'normal' }}>(optional)</span></label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <input type="file" id="file-upload" className="file-input" style={{ fontSize: '13px', color: 'var(--ink)' }} />
                </div>
                <span className="file-hint" style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>PDF, image or spreadsheet. Pricing you share stays confidential.</span>
              </div>
              
              <div className="form-group checkbox-group" style={{ marginTop: '16px' }}>
                <label className="checkbox-label" style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer' }}>
                  <input type="checkbox" required style={{ marginTop: '4px' }} />
                  <span style={{ fontSize: '13px', color: 'var(--ink-soft)', lineHeight: '1.5' }}>VDS can use these details to respond to this enquiry. We don't share them or add you to marketing lists.</span>
                </label>
              </div>
              
              <Button type="submit" disabled={isSubmitting} className="submit-btn" style={{ marginTop: '8px', background: 'var(--cyan)', color: '#000', padding: '14px', border: 'none' }} iconRight={ArrowRight}>
                {isSubmitting ? 'Sending...' : 'Send quote request'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
