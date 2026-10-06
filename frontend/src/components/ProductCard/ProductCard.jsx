import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight, ShoppingCart } from 'lucide-react';
import { useContext, useState } from 'react';
import { CartContext } from '../../context/CartContext';
import QuickViewModal from '../QuickViewModal/QuickViewModal';
import './ProductCard.css';

export default function ProductCard({
  product,
  compact = false,
  showPrice = true,
  showBadge = true,
  showStock = true,
}) {
  const { addToCart } = useContext(CartContext);
  const [showModal, setShowModal] = useState(false);
  const stockClass =
    product.stockStatus === 'In Stock'
      ? 'product-card__stock--in'
      : product.stockStatus === 'Limited Stock'
      ? 'product-card__stock--limited'
      : 'product-card__stock--out';

  return (
    <div className={`product-card ${compact ? 'product-card--compact' : ''}`}>
      <Link to={`/product/${product.id}`} className="product-card__image" style={{ textDecoration: 'none' }}>
        {product.image && product.image !== '/images/placeholder.jpg' ? (
          <img 
            src={product.image.replace(/\.(png|jpe?g)$/i, '.webp')} 
            alt={product.name} 
            className="product-card__img" 
            loading="lazy" 
            decoding="async" 
          />
        ) : (
          <div className="product-card__image-placeholder">
            <ShieldCheck size={compact ? 28 : 40} />
          </div>
        )}
        {showStock && (
          <span className={`product-card__stock ${stockClass}`}>
            {product.stockStatus}
          </span>
        )}
      </Link>

      <div className="product-card__body">
        <span className="product-card__sku">{product.sku}</span>
        <Link to={`/product/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <h4 className="product-card__name">{product.name}</h4>
        </Link>

        {!compact && (
          <Link to={`/product/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <p className="product-card__desc">{product.description}</p>
          </Link>
        )}

        {!compact && showBadge && product.certifications && (
          <div className="product-card__tags">
            {product.certifications.slice(0, 3).map((cert) => (
              <span key={cert} className="product-card__tag">{cert}</span>
            ))}
          </div>
        )}

        <div className="product-card__bottom">
          {showPrice && (
            <span className="product-card__price">{product.priceLabel}</span>
          )}
          <button 
            className="product-card__action product-card__add-btn"
            style={{ 
              background: 'var(--color-primary-container, #2d5a88)', 
              border: 'none', 
              cursor: 'pointer', 
              fontFamily: 'inherit', 
              fontSize: '0.9rem', 
              color: 'var(--color-on-primary, #ffffff)', 
              display: 'flex', 
              alignItems: 'center',
              padding: '6px 12px',
              borderRadius: '4px',
              fontWeight: '600'
            }}
            onClick={(e) => {
              e.preventDefault();
              setShowModal(true);
            }}
          >
            Add to Cart <ShoppingCart size={14} style={{ marginLeft: '6px' }} />
          </button>
        </div>
        {product.bulkOrderAvailable && (
          <Link to={`/request-quote?product=${product.id}`} className="product-card__bulk-order">
            Bulk Order? Talk to us <ArrowRight size={14} />
          </Link>
        )}
      </div>

      <QuickViewModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        product={product} 
      />
    </div>
  );
}
