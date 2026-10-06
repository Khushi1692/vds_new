import { useContext, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Trash2, ArrowRight, ArrowLeft } from 'lucide-react';
import { CartContext } from '../../context/CartContext';
import { AuthContext } from '../../context/AuthContext';
import Button from '../../components/Button/Button';
import CheckoutModal from '../../components/CheckoutModal/CheckoutModal';
import PaymentSuccessModal from '../../components/PaymentSuccessModal/PaymentSuccessModal';
import './Cart.css';

export default function Cart() {
  const { cartItems, removeFromCart, updateQuantity, clearCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successOrderId, setSuccessOrderId] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const handleCheckout = () => {
    if (!user) {
      navigate('/login', { state: { from: location } });
      return;
    }
    setShowCheckoutModal(true);
  };

  const handleCheckoutSuccess = (orderId) => {
    setShowCheckoutModal(false);
    clearCart();
    setSuccessOrderId(orderId);
    setShowSuccessModal(true);
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      // The price format is "$995.00", let's strip the '$' and parse it.
      const priceStr = item.product.priceLabel.replace(/[^0-9.]/g, '');
      const price = parseFloat(priceStr);
      return total + (isNaN(price) ? 0 : price * item.quantity);
    }, 0);
  };

  if (cartItems.length === 0) {
    return (
      <main className="cart-page">
        <div className="container cart-empty">
          <h2>Your Cart is Empty</h2>
          <p>Looks like you haven't added anything to your cart yet.</p>
          <Button as={Link} to="/products" variant="primary" icon={ArrowLeft}>
            Continue Shopping
          </Button>
        </div>
        <PaymentSuccessModal 
          isOpen={showSuccessModal} 
          orderId={successOrderId} 
          onClose={() => setShowSuccessModal(false)} 
        />
      </main>
    );
  }

  return (
    <main className="cart-page">
      <div className="container cart-inner">
        <h1 className="cart-title">Your Cart</h1>
        <div className="cart-content">
          <div className="cart-items">
            {cartItems.map((item) => (
              <div key={item.product.id} className="cart-item">
                <div className="cart-item-image">
                  <img 
                    src={item.product.image?.replace(/\.(png|jpe?g)$/i, '.webp')} 
                    alt={item.product.name} 
                    loading="lazy" 
                  />
                </div>
                <div className="cart-item-details">
                  <Link to={`/product/${item.product.id}`} className="cart-item-name">
                    {item.product.name}
                  </Link>
                  <p className="cart-item-sku">{item.product.sku}</p>
                  <p className="cart-item-price">{item.product.priceLabel}</p>
                </div>
                <div className="cart-item-actions">
                  <div className="cart-qty-selector">
                    <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>+</button>
                  </div>
                  <button className="cart-item-remove" onClick={() => removeFromCart(item.product.id)}>
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
            <div className="cart-clear">
              <button onClick={clearCart} className="clear-cart-btn">Empty Cart</button>
            </div>
          </div>
          
          <div className="cart-summary">
            <h2>Order Summary</h2>
            <div className="summary-row">
              <span>Subtotal ({cartItems.length} items)</span>
              <span>${calculateTotal().toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Shipping</span>
              <span>Calculated at checkout</span>
            </div>
            <div className="summary-row summary-total">
              <span>Total (ex GST)</span>
              <span>${calculateTotal().toFixed(2)}</span>
            </div>
            
            <Button 
              className="checkout-btn" 
              fullWidth 
              onClick={handleCheckout}
            >
              Proceed to Checkout
            </Button>
            
            <p className="summary-note">
              Tax and shipping charges are calculated at checkout.
            </p>
          </div>
        </div>
      </div>
      
      <CheckoutModal 
        isOpen={showCheckoutModal} 
        onClose={() => setShowCheckoutModal(false)}
        cartItems={cartItems}
        totalAmount={calculateTotal()}
        onSuccess={handleCheckoutSuccess}
      />

      <PaymentSuccessModal 
        isOpen={showSuccessModal} 
        orderId={successOrderId} 
        onClose={() => setShowSuccessModal(false)} 
      />
    </main>
  );
}
