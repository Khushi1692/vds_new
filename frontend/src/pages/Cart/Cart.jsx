import { useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Trash2, ArrowRight, ArrowLeft, ShieldAlert, FileText } from 'lucide-react';
import { CartContext } from '../../context/CartContext';
import { AuthContext } from '../../context/AuthContext';
import Button from '../../components/Button/Button';
import './Cart.css';

export default function Cart() {
  const { cartItems, removeFromCart, updateQuantity, clearCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleCheckout = () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/checkout' } } });
      return;
    }
    navigate('/checkout');
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      let price = typeof item.product?.price === 'number' && !isNaN(item.product.price) ? item.product.price : null;
      if (price === null && item.product?.priceLabel) {
        const firstPart = item.product.priceLabel.split('/')[0];
        price = parseFloat(firstPart.replace(/[^0-9.]/g, ''));
      }
      return total + (isNaN(price) || price === null ? 0 : price * item.quantity);
    }, 0);
  };

  const subtotal = calculateTotal();
  const estimatedGst = subtotal * 0.10;

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
      </main>
    );
  }

  return (
    <main className="cart-page">
      <div className="container cart-inner">
        <h1 className="cart-title">Your Cart</h1>

        {/* Pricing notice disclaimer */}
        <div className="cart-pricing-disclaimer">
          <ShieldAlert size={22} />
          <div>
            <strong>Important B2B Pricing Notice:</strong> All product prices are <strong>strictly exclusive of GST and delivery charges</strong>. At checkout, you will select your receiving store and request a final tax invoice including calculated courier freight and GST.
          </div>
        </div>

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
                  <p className="cart-item-price">
                    {item.product.priceLabel?.split(' / ')[0]} 
                    <span style={{ fontSize: '0.8rem', color: 'var(--ink-soft)', fontWeight: 400, marginLeft: '6px' }}>
                      (ex GST)
                    </span>
                  </p>
                </div>
                <div className="cart-item-actions">
                  <div className="cart-qty-selector">
                    <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>+</button>
                  </div>
                  <button className="cart-item-remove" onClick={() => removeFromCart(item.product.id)} title="Remove item">
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
              <span>Subtotal ({cartItems.length} lines, ex GST)</span>
              <strong>${subtotal.toFixed(2)}</strong>
            </div>
            <div className="summary-row">
              <span>Estimated GST (10%)</span>
              <span style={{ color: 'var(--cyan)' }}>+${estimatedGst.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Delivery Charge (Entire Order)</span>
              <span style={{ color: '#fbbf24', fontStyle: 'italic', fontSize: '0.88rem' }}>
                Single fee calculated at checkout
              </span>
            </div>
            <div className="summary-row summary-total">
              <div>
                <span>Subtotal (ex GST & Delivery)</span>
                <span style={{ display: 'block', fontSize: '0.75rem', color: '#fbbf24', fontWeight: 400 }}>
                  + Single order delivery fee & 10% GST added on final invoice
                </span>
              </div>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            
            <Button 
              className="checkout-btn" 
              fullWidth 
              onClick={handleCheckout}
            >
              <FileText size={18} />
              <span>Proceed to Final Invoice Request</span>
            </Button>
            
            <p className="summary-note">
              No payment is required now. You will choose your delivery store and receive an official final tax invoice.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
