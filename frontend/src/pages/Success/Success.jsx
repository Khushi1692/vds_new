import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';
import Button from '../../components/Button/Button';
import './Success.css';

export default function Success() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const type = searchParams.get('type');

  const isQuote = type === 'quote';

  return (
    <main className="success-page">
      <div className="container" style={{ textAlign: 'center', padding: '100px 0' }}>
        <CheckCircle size={64} style={{ color: 'var(--cyan)', margin: '0 auto 20px' }} />
        <h1>{isQuote ? 'Quote Request Sent' : 'Payment Successful!'}</h1>
        <p>
          {isQuote 
            ? "Thank you for your enquiry. We'll be in touch with your customized quote shortly."
            : "Thank you for your purchase. Your order is being processed."
          }
        </p>
        {sessionId && !isQuote && <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>Session ID: {sessionId}</p>}
        <div style={{ marginTop: '40px' }}>
          <Button as={Link} to="/products" variant="primary" iconRight={ArrowRight}>
            Continue Shopping
          </Button>
        </div>
      </div>
    </main>
  );
}
