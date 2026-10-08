import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useContext } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Truck,
  ChevronRight,
  ShoppingCart
} from 'lucide-react';
import Button from '../../components/Button/Button';
import ProductCard from '../../components/ProductCard/ProductCard';
import { fetchProductById, fetchRelatedProducts } from '../../data/products';
import { CartContext } from '../../context/CartContext';
import './ProductDetail.css';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const { addToCart } = useContext(CartContext);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchProductById(id),
      fetchRelatedProducts(id, 4)
    ]).then(([prod, rel]) => {
      setProduct(prod);
      setRelated(rel);
      setActiveImage(0); // Reset on product load
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    if (product) {
      document.title = `${product.name} | VDS — Victoria Diagnostic Supplies`;
      const meta = document.querySelector('meta[name="description"]');
      if (meta) {
        meta.setAttribute(
          'content',
          `${product.tagline || ''} Available through VDS (Victoria Diagnostic Supplies) Australia.`
        );
      }
    } else if (!loading) {
      document.title = "Product Not Found | VDS — Victoria Diagnostic Supplies";
    }
  }, [product, loading]);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    navigate('/cart');
  };

  if (loading) {
    return (
      <main className="pd">
        <div className="container pd__not-found">
          <h2>Loading...</h2>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="pd">
        <div className="container pd__not-found">
          <h2>Product not found</h2>
          <Button as={Link} to="/products" variant="primary" icon={ArrowLeft}>
            Back to Products
          </Button>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="pd">
        {/* Breadcrumb */}
        <div className="container pd__breadcrumb">
          <Link to="/">Home</Link>
          <ChevronRight size={14} />
          <Link to="/products">Products</Link>
          <ChevronRight size={14} />
          <span>{product.name}</span>
        </div>

        {/* Product Hero */}
        <section className="container pd__hero">
          <div className="pd__hero-image" style={{ display: 'flex', flexDirection: 'column-reverse', gap: '16px', alignItems: 'center', width: '100%' }}>
            {/* Gallery Thumbnails */}
            {product.images && product.images.length > 1 && (
              <div className="pd__gallery-thumbs" style={{ display: 'flex', flexDirection: 'row', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
                {product.images.map((img, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    onMouseEnter={() => setActiveImage(idx)}
                    style={{
                      border: activeImage === idx ? '2px solid var(--cyan)' : '2px solid transparent',
                      padding: '2px',
                      background: '#ffffff',
                      cursor: 'pointer',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      width: '80px',
                      height: '80px',
                      flexShrink: 0
                    }}
                  >
                    <img 
                      src={img.replace(/\.(png|jpe?g)$/i, '.webp')} 
                      alt={`${product.name} view ${idx + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '4px' }}
                    />
                  </button>
                ))}
              </div>
            )}
            
            {/* Main Image */}
            <div className="pd__main-image" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffffff', borderRadius: '8px', padding: '24px' }}>
              {(product.images && product.images.length > 0 ? product.images[activeImage] : product.image) && (product.images && product.images.length > 0 ? product.images[activeImage] : product.image) !== '/images/placeholder.jpg' ? (
                <img 
                  src={(product.images && product.images.length > 0 ? product.images[activeImage] : product.image).replace(/\.(png|jpe?g)$/i, '.webp') + '?v=2'} 
                  alt={product.name} 
                  className="pd__hero-img" 
                  decoding="async" 
                  style={{ width: '100%', maxHeight: '450px', objectFit: 'contain', display: 'block', borderRadius: '8px' }}
                />
              ) : (
                <div className="pd__hero-image-placeholder">
                  <ShieldCheck size={72} color="#9ca3af" />
                </div>
              )}
            </div>
          </div>

          <div className="pd__hero-info">
            {product.heroQuote && (
              <blockquote className="pd__quote">"{product.heroQuote}"</blockquote>
            )}

            <span className="pd__sku-badge">{product.sku}</span>
            <h1 className="pd__title">{product.name}</h1>
            <p className="pd__tagline">{product.tagline}</p>

            <div className="pd__price-row">
              <span className="pd__price">{product.priceLabel}</span>
            </div>

            <div className="pd__meta-row">
              {product.liveStock && (
                <span className="pd__meta-tag pd__meta-tag--stock">
                  🟢 {product.liveStock} units physically in stock
                </span>
              )}
            </div>

            <div className="pd__actions-wrapper">
              <div className="pd__purchase-flow">
                <div className="pd__qty-selector">
                  <label htmlFor="qty-select">Qty:</label>
                  <select
                    id="qty-select"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="pd__qty-input"
                  >
                    {[...Array(10).keys()].map((n) => (
                      <option key={n + 1} value={n + 1}>
                        {n + 1}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="pd__buttons-row" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <Button
                    onClick={handleAddToCart}
                    variant="primary"
                    size="lg"
                    iconRight={ShoppingCart}
                  >
                    Add to Cart
                  </Button>
                  <Button
                    as={Link}
                    to={`/request-quote?product=${product.id}&qty=${quantity}`}
                    variant="secondary"
                    size="lg"
                    iconRight={ArrowRight}
                  >
                    Request B2B Quote
                  </Button>
                </div>
              </div>
            </div>

            {product.badges && (
              <div className="pd__badges">
                {product.badges.map((b) => (
                  <div key={b.label} className="pd__badge">
                    {b.icon === 'Truck' ? <Truck size={20} /> : <ShieldCheck size={20} />}
                    <div>
                      <strong>{b.label}</strong>
                      <span>{b.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </section>

        {/* Technical Specs */}
        {product.specs && product.specs.length > 0 && (
          <section className="pd__specs-section">
            <div className="container">
              <h2 className="pd__section-title">Technical Specifications</h2>
              {product.description && (
                <p className="pd__specs-desc">{product.description}</p>
              )}
              <div className="pd__specs-grid">
                {product.specs.map((spec, i) => (
                  <div key={i} className="pd__spec-item">
                    <span className="pd__spec-label">{spec.label}</span>
                    <span className="pd__spec-value">{spec.value}</span>
                    {spec.detail && (
                      <span className="pd__spec-detail">{spec.detail}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Related Products */}
        {related && related.length > 0 && (
          <section className="pd__related">
            <div className="container">
              <div className="pd__related-header">
                <h2 className="pd__section-title">Related Equipment</h2>
                <Button as={Link} to="/products" variant="ghost" size="sm" iconRight={ArrowRight}>
                  View All Products
                </Button>
              </div>
              <div className="pd__related-grid">
                {related.map((p) => (
                  <ProductCard key={p.id} product={p} compact />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </>
  );
}
