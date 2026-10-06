import { useState, useEffect, useContext } from 'react';
import { X } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { AuthContext } from '../../context/AuthContext';
import './CheckoutModal.css';

// Initialize stripe with a placeholder or env variable.
// In a real app, you should use your actual Stripe Public Key.
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY); 

const CheckoutForm = ({ clientSecret, amount, onSuccess, token, orderId, user }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [phone, setPhone] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement),
        billing_details: {
          phone: phone,
          email: user?.email,
          name: user?.name,
        }
      },
      receipt_email: user?.email
    });

    if (stripeError) {
      setError(stripeError.message);
      setLoading(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      try {
        await fetch('/api/checkout/confirm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ paymentIntentId: paymentIntent.id })
        });
      } catch (confirmErr) {
        console.warn('Failed to call /api/checkout/confirm:', confirmErr);
      }
      onSuccess(orderId);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="checkout-form">
      <input 
        type="text" 
        className="checkout-input" 
        placeholder="Phone number (for receipt)" 
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        required
      />
      
      <textarea 
        className="checkout-input" 
        placeholder="Special instructions (optional)" 
      ></textarea>

      <div className="stripe-element-container">
        <CardElement options={{
          style: {
            base: {
              fontSize: '16px',
              color: '#424770',
              '::placeholder': {
                color: '#aab7c4',
              },
            },
            invalid: {
              color: '#9e2146',
            },
          },
        }} />
      </div>

      {error && <div style={{ color: 'red', fontSize: '14px' }}>{error}</div>}

      <button 
        type="submit" 
        className="checkout-pay-btn" 
        disabled={!stripe || loading}
      >
        {loading ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
      </button>
    </form>
  );
};

export default function CheckoutModal({ isOpen, onClose, cartItems, totalAmount, onSuccess }) {
  const { user, token } = useContext(AuthContext);
  const [clientSecret, setClientSecret] = useState('');
  const [orderId, setOrderId] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && cartItems.length > 0 && user) {
      const items = cartItems.map(item => ({
        productId: item.product.id,
        quantity: item.quantity
      }));

      fetch('/api/checkout/intent', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ items, userId: user.id })
      })
      .then(async res => {
        const data = await res.json();
        if (res.status === 401) {
          throw new Error('Your session has expired. Please sign out and sign in again.');
        }
        return data;
      })
      .then(data => {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
          if (data.orderId) setOrderId(data.orderId);
        } else {
          setError(data.error || 'Failed to initialize checkout');
        }
      })
      .catch(err => {
        setError(err.message === 'Failed to fetch' ? 'Network error' : err.message);
      });
    }
  }, [isOpen, cartItems, user, token]);

  if (!isOpen) return null;

  return (
    <div className="checkout-modal-overlay" onClick={onClose}>
      <div className="checkout-modal-content" onClick={e => e.stopPropagation()}>
        <button className="checkout-modal-close" onClick={onClose}>
          <X size={24} />
        </button>
        
        <h2 className="checkout-modal-title">Checkout</h2>

        {error ? (
          <div style={{ color: 'red', textAlign: 'center' }}>{error}</div>
        ) : !clientSecret ? (
          <div style={{ textAlign: 'center' }}>Loading secure checkout...</div>
        ) : (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutForm 
              clientSecret={clientSecret} 
              amount={totalAmount} 
              onSuccess={onSuccess} 
              token={token} 
              orderId={orderId}
              user={user}
            />
          </Elements>
        )}
      </div>
    </div>
  );
}
