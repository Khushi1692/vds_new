import { useState, useContext, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ShieldCheck } from 'lucide-react';
import { CartContext } from '../../context/CartContext';
import './QuickViewModal.css';

export default function QuickViewModal({ product, isOpen, onClose }) {
  const { addToCart } = useContext(CartContext);
  const [quantity, setQuantity] = useState(1);

  // Reset quantity when modal opens for a new product
  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  // Extract numeric price from priceLabel (e.g. "$995.00")
  const numericPrice = parseFloat(product.priceLabel.replace(/[^0-9.]/g, '')) || 0;
  const subtotal = numericPrice * quantity;

  const handleAdd = () => {
    addToCart(product, quantity);
    onClose();
  };

  return createPortal(
    <div className="qvm-overlay" onClick={onClose}>
      <div className="qvm-content" onClick={e => e.stopPropagation()}>
        <button className="qvm-close" onClick={onClose}>
          <X size={24} />
        </button>

        <div className="qvm-header">
          <h2 className="qvm-title">{product.name.toUpperCase()}</h2>
        </div>

        <div className="qvm-body">
          <div className="qvm-top-row">
            <div className="qvm-image-container">
              {product.image && product.image !== '/images/placeholder.jpg' ? (
                <img 
                  src={product.image.replace(/\.(png|jpe?g)$/i, '.webp')} 
                  alt={product.name} 
                  loading="lazy" 
                  decoding="async" 
                />
              ) : (
                <ShieldCheck size={48} />
              )}
            </div>
            <div className="qvm-details">
              <h3 className="qvm-name-small">{product.name.toUpperCase()}</h3>
            <div className="qvm-price-display">{product.priceLabel?.split(' / ')[0]}</div>
            </div>
          </div>

          <div className="qvm-divider"></div>

          <div className="qvm-quantity-row">
            <span className="qvm-label">QUANTITY</span>
            <div className="qvm-qty-controls">
              <button 
                className="qvm-qty-btn" 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                -
              </button>
              <div className="qvm-qty-val">{quantity}</div>
              <button 
                className="qvm-qty-btn" 
                onClick={() => setQuantity(quantity + 1)}
              >
                +
              </button>
            </div>
          </div>

          <div className="qvm-summary-row">
            <span className="qvm-label">PRICE:</span>
            <span className="qvm-summary-value">{product.priceLabel?.split(' / ')[0]}</span>
          </div>
          
          <div className="qvm-summary-row">
            <span className="qvm-label">SUBTOTAL:</span>
            <span className="qvm-summary-value">${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>

        <div className="qvm-footer">
          <button className="qvm-add-btn" onClick={handleAdd}>
            ADD TO CART
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
