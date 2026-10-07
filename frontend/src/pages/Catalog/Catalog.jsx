import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import ProductCard from '../../components/ProductCard/ProductCard';
import { fetchProducts } from '../../data/products';
import './Catalog.css';

export default function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const activeCat = searchParams.get('cat') || 'all';

  useEffect(() => {
    const q = searchParams.get('search');
    if (q !== null) {
      setSearchQuery(q);
    }
  }, [searchParams]);

  useEffect(() => {
    document.title = "Radiology Supplies | VDS — Victoria Diagnostic Supplies";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute(
        'content',
        'Contrast, injector, positioning, protection and ultrasound consumables and equipment, supplied directly by VDS (Victoria Diagnostic Supplies).'
      );
    }
  }, []);

  useEffect(() => {
    fetchProducts().then(data => {
      setProducts(data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedSetting, setSelectedSetting] = useState('');
  const [regulatoryChecked, setRegulatoryChecked] = useState(false);

  const categoryCounts = useMemo(() => {
    const predefinedCategories = [
      "Medical Imaging Consumables",
      "Infection Prevention",
      "Furniture and Patient Transfer",
      "Medical Equipment",
      "Everyday Paper Supplies"
    ];

    const counts = {};
    predefinedCategories.forEach(cat => counts[cat] = 0);

    products.forEach(p => {
      if (!p.category) return;
      const match = predefinedCategories.find(c => c.toLowerCase() === p.category.toLowerCase());
      if (match) {
        counts[match] += 1;
      } else {
        counts[p.category] = (counts[p.category] || 0) + 1;
      }
    });

    const extraCategories = Object.keys(counts)
      .filter(c => !predefinedCategories.includes(c))
      .sort((a, b) => a.localeCompare(b));
    
    return [
      ...predefinedCategories.map(cat => [cat, counts[cat]]),
      ...extraCategories.map(cat => [cat, counts[cat]])
    ];
  }, [products]);

  const handleCategoryChange = (cat) => {
    setSelectedCategories(prev => 
      prev.includes(cat) 
        ? prev.filter(c => c !== cat) 
        : [...prev, cat]
    );
  };

  const filtered = useMemo(() => {
    let result = [...products];

    if (selectedCategories.length > 0) {
      result = result.filter(p => selectedCategories.includes(p.category));
    } else if (activeCat !== 'all') {
      result = result.filter((p) => p.category === activeCat);
    }

    if (selectedSetting) {
      // Assuming 'inds' array on products holds settings like 'radiology', 'gp', etc.
      result = result.filter(p => p.inds && p.inds.includes(selectedSetting));
    }

    if (regulatoryChecked) {
      // Assuming 'artg' field specifies if the product has ARTG number
      result = result.filter(p => p.artg);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }

    return result;
  }, [products, activeCat, searchQuery, selectedCategories, selectedSetting, regulatoryChecked]);

  const handleClearFilters = () => {
    setSelectedCategories([]);
    setSearchQuery('');
    setSelectedSetting('');
    setRegulatoryChecked(false);
    setSearchParams({});
  };

  const hasFilters = selectedCategories.length > 0 || searchQuery.trim() !== '' || activeCat !== 'all' || selectedSetting !== '' || regulatoryChecked;

  return (
    <>
      <main className="catalog">
        {/* Hero Section */}
        <section className="catalog__hero">
          <div className="container">
            <div className="crumbs" style={{ display: 'flex', gap: '8px', marginBottom: '24px', fontSize: '13px', fontFamily: 'var(--font-family-mono)', color: 'var(--ink-soft)' }}>
               <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
               <span>/</span>
               <span style={{ color: 'var(--ink)' }}>Range</span>
            </div>
            <h1 className="catalog__h1">The range</h1>
            <p className="catalog__lead">
              Radiology and clinical consumables, imported direct. Every line comes with its regulatory details before you order.
            </p>
          </div>
        </section>

        <div className="container catalog__inner">
          {/* Sidebar */}
          <aside className="catalog__sidebar">
            <div className="filter-group">
              <h3 className="filter-title">Search</h3>
              <input
                type="text"
                className="filter-search-input"
                placeholder="Product, use or clinical term"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="filter-group">
              <h3 className="filter-title">CATEGORY</h3>
              <div className="filter-options">
                {categoryCounts.map(([cat, count]) => (
                  <label key={cat} className="filter-checkbox-label">
                    <input 
                      type="checkbox" 
                      className="filter-checkbox"
                      checked={selectedCategories.includes(cat)}
                      onChange={() => handleCategoryChange(cat)}
                    />
                    <span className="filter-checkbox-text">{cat}</span>
                    <span className="filter-checkbox-count">{count}</span>
                  </label>
                ))}
              </div>
            </div>

          </aside>

          {/* Catalog Main Content */}
          <div className="catalog__main">
            {/* Results Count bar */}
            <div className="catalog__results-bar">
              <span className="catalog__count">
                {loading ? 'Loading catalog items...' : (
                  <>{filtered.length} of {products.length} product lines</>
                )}
              </span>
              <button 
                className="catalog__clear-filters" 
                onClick={handleClearFilters}
                style={{ opacity: hasFilters ? 1 : 0.4, cursor: hasFilters ? 'pointer' : 'default' }}
                disabled={!hasFilters}
              >
                Clear filters
              </button>
            </div>

            <div className="catalog__grid">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <div 
                    key={`skel-${i}`} 
                    className="product-card" 
                    style={{ minHeight: '380px', opacity: 0.15, background: 'var(--card)' }} 
                  />
                ))
              ) : (
                filtered.map((product) => (
                  <ProductCard key={product.id} product={product} showBadge={false} />
                ))
              )}
            </div>

            {!loading && filtered.length === 0 && (
              <div className="catalog__empty">
                <p>No medical supplies match the active search criteria.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

