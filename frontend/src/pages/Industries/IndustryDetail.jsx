import { useState, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { INDS } from '../../data/industries';
import { fetchProducts } from '../../data/products';
import ProductCard from '../../components/ProductCard/ProductCard';
import './IndustryDetail.css';

export default function IndustryDetail() {
  const { id } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const industry = INDS.find(i => i.id === id);

  useEffect(() => {
    if (!industry) return;
    
    document.title = `${industry.name} supplies | VDS`;
    
    fetchProducts()
      .then(data => {
        // Since backend doesn't have industries mapping, we just show 4 random products or featured ones
        setProducts(data.slice(0, 4));
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [industry]);

  if (!industry) {
    return <Navigate to="/industries" replace />;
  }

  return (
    <main className="industry-detail-page">
      <div className="phead">
        <div className="container stack-lg">
          <div className="crumbs">
            <Link to="/">Home</Link>
            <span>/</span>
            <Link to="/industries">Industries</Link>
            <span>/</span>
            <span>{industry.name}</span>
          </div>
          
          <span className="eyebrow">{industry.name}</span>
          <h1>{industry.head}</h1>
          <p className="lede">{industry.lede}</p>
          
          <div className="action-buttons">
            <Link className="btn primary" to="/request-quote">Request a quote <span className="arr">→</span></Link>
            <Link className="btn" to="/request-quote?type=pricecheck">Price-check your current supplier</Link>
          </div>
        </div>
      </div>
      
      <section className="band pillars-section">
        <div className="container">
          <div className="pillars">
            {industry.points.map((pt, n) => (
              <div className="pillar" key={n}>
                <h3>{pt[0]}</h3>
                <p>{pt[1]}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      <section className="band lines-section">
        <div className="container">
          <div className="shead">
            <h2>Lines for {industry.name.toLowerCase()}</h2>
            <Link className="btn" to="/products">Full range <span className="arr">→</span></Link>
          </div>
          
          {loading ? (
            <div className="loading-state">Loading products...</div>
          ) : (
            <div className="grid-prod">
              {products.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
