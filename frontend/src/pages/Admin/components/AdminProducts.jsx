import React, { useState, useEffect, useMemo } from 'react';
import { 
  Package, Search, Filter, DollarSign, CheckCircle2, 
  AlertCircle, RefreshCw, Tag, Box, ArrowUpDown, Check, X
} from 'lucide-react';
import { getApiUrl } from '../../../config/api';

export default function AdminProducts({ token }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Tracking edited prices: { [productId]: { price: string, saving: boolean, success: boolean, error: string } }
  const [editState, setEditState] = useState({});

  const loadProducts = async () => {
    if (!token) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch(getApiUrl('/api/admin/products'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        throw new Error('Failed to load product catalog');
      }
      const data = await res.json();
      setProducts(data);

      // Initialize edit state with current prices
      const initial = {};
      data.forEach(p => {
        initial[p.id] = {
          price: p.price !== undefined && p.price !== null ? p.price.toString() : '0',
          originalPrice: p.price !== undefined && p.price !== null ? p.price : 0,
          stockStatus: p.stockStatus || 'In Stock',
          liveStock: p.liveStock !== undefined ? p.liveStock.toString() : '100',
          saving: false,
          success: false,
          error: ''
        };
      });
      setEditState(initial);
    } catch (err) {
      setError(err.message || 'Error loading products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [token]);

  // Unique categories for filter
  const categories = useMemo(() => {
    const set = new Set();
    products.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set).sort();
  }, [products]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (categoryFilter !== 'all' && p.category !== categoryFilter) {
        return false;
      }
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const matchesName = p.name?.toLowerCase().includes(term);
        const matchesSku = p.sku?.toLowerCase().includes(term);
        const matchesCat = p.category?.toLowerCase().includes(term);
        const matchesArtg = p.artgNumber?.toLowerCase().includes(term);
        if (!matchesName && !matchesSku && !matchesCat && !matchesArtg) {
          return false;
        }
      }
      return true;
    });
  }, [products, categoryFilter, searchTerm]);

  // Handle price input change with decimal validation
  const handlePriceChange = (productId, val) => {
    if (val !== '' && !/^\d*\.?\d{0,2}$/.test(val)) {
      return;
    }
    setEditState(prev => ({
      ...prev,
      [productId]: {
        ...(prev[productId] || {}),
        price: val,
        success: false,
        error: ''
      }
    }));
  };

  // Reset product price back to original
  const handleResetPrice = (productId) => {
    setEditState(prev => {
      const orig = prev[productId]?.originalPrice !== undefined ? prev[productId].originalPrice : 0;
      return {
        ...prev,
        [productId]: {
          ...(prev[productId] || {}),
          price: orig.toString(),
          success: false,
          error: ''
        }
      };
    });
  };

  // Save updated product price to backend
  const handleSaveProductPrice = async (product) => {
    const current = editState[product.id];
    if (!current) return;

    const parsedPrice = parseFloat(current.price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setEditState(prev => ({
        ...prev,
        [product.id]: {
          ...prev[product.id],
          error: 'Please enter a valid positive price'
        }
      }));
      return;
    }

    setEditState(prev => ({
      ...prev,
      [product.id]: { ...prev[product.id], saving: true, error: '', success: false }
    }));

    try {
      const res = await fetch(getApiUrl(`/api/admin/products/${product.id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          price: parsedPrice
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update price');

      // Update local product list and update originalPrice
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, price: parsedPrice } : p));
      setEditState(prev => ({
        ...prev,
        [product.id]: {
          ...prev[product.id],
          price: parsedPrice.toString(),
          originalPrice: parsedPrice,
          saving: false,
          success: true,
          error: ''
        }
      }));

      // Clear success badge after 3 seconds
      setTimeout(() => {
        setEditState(prev => ({
          ...prev,
          [product.id]: { ...prev[product.id], success: false }
        }));
      }, 3000);
    } catch (err) {
      setEditState(prev => ({
        ...prev,
        [product.id]: {
          ...prev[product.id],
          saving: false,
          error: err.message || 'Save failed'
        }
      }));
    }
  };

  return (
    <div className="admin-products-tab">
      {/* Top Controls Toolbar */}
      <div className="products-toolbar">
        <div className="search-bar-wrap">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search catalog by product name, SKU, ARTG #, or category..."
          />
          {searchTerm && (
            <button type="button" className="clear-btn" onClick={() => setSearchTerm('')}>
              ×
            </button>
          )}
        </div>

        <div className="category-filter-wrap">
          <Filter size={16} className="filter-icon" />
          <select 
            value={categoryFilter} 
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="category-select"
          >
            <option value="all">All Categories ({products.length})</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat} ({products.filter(p => p.category === cat).length})
              </option>
            ))}
          </select>
        </div>

        <button 
          type="button" 
          className="header-refresh-btn"
          onClick={loadProducts}
          disabled={loading}
          title="Refresh Catalog"
        >
          <RefreshCw size={14} className={loading ? 'spinning-icon' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="admin-portal-error-alert" style={{ marginBottom: '16px' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Catalog Table */}
      <div className="table-responsive-container">
        <table className="admin-data-table products-catalog-table">
          <thead>
            <tr>
              <th style={{ width: '60px' }}>Image</th>
              <th>Product Details</th>
              <th>Category</th>
              <th>SKU & ARTG</th>
              <th>Stock Status</th>
              <th className="text-right" style={{ width: '220px' }}>Unit Price (Ex GST)</th>
              <th className="text-center" style={{ width: '130px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((p) => {
              const current = editState[p.id] || {
                price: (p.price || 0).toString(),
                originalPrice: p.price || 0,
                saving: false,
                success: false,
                error: ''
              };

              const numPrice = parseFloat(current.price) || 0;
              const isModified = Math.abs(numPrice - (current.originalPrice || 0)) > 0.001;

              return (
                <tr key={p.id} className="product-row">
                  {/* Thumbnail */}
                  <td className="product-thumb-cell">
                    {p.image ? (
                      <img src={p.image} alt={p.name} className="product-thumb-img" />
                    ) : (
                      <div className="product-thumb-fallback">
                        <Box size={20} />
                      </div>
                    )}
                  </td>

                  {/* Product Details */}
                  <td className="product-title-cell">
                    <strong className="product-name-title">{p.name}</strong>
                    {p.tagline && <div className="product-tagline">{p.tagline}</div>}
                    <div className="product-id-tag">ID: {p.id}</div>
                  </td>

                  {/* Category */}
                  <td>
                    <span className="category-pill">{p.category || 'General Supplies'}</span>
                  </td>

                  {/* SKU & ARTG */}
                  <td>
                    <div className="sku-code">{p.sku || 'N/A'}</div>
                    {p.artgNumber && (
                      <div className="artg-pill" title="Australian Register of Therapeutic Goods">
                        ARTG #{p.artgNumber}
                      </div>
                    )}
                  </td>

                  {/* Stock Status */}
                  <td>
                    <span className={`stock-status-pill ${p.stockStatus === 'In Stock' ? 'instock' : 'backorder'}`}>
                      {p.stockStatus || 'In Stock'}
                    </span>
                  </td>

                  {/* Editable Price (Ex GST) */}
                  <td className="text-right">
                    <div className="price-edit-group">
                      <div className={`catalog-price-input-wrapper ${isModified ? 'modified' : ''}`}>
                        <span className="price-prefix">$</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={current.price}
                          onChange={(e) => handlePriceChange(p.id, e.target.value)}
                          className="catalog-price-input"
                          placeholder="0.00"
                        />
                        {isModified && (
                          <button
                            type="button"
                            className="price-reset-icon-btn"
                            onClick={() => handleResetPrice(p.id)}
                            title="Reset to original catalog price"
                          >
                            ↺
                          </button>
                        )}
                      </div>

                      {isModified && (
                        <div className="price-diff-hint">
                          Was ${(current.originalPrice || 0).toFixed(2)}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Action / Save Button */}
                  <td className="text-center">
                    <button
                      type="button"
                      className={`product-save-btn ${isModified ? 'needs-save' : ''} ${current.success ? 'saved' : ''}`}
                      onClick={() => handleSaveProductPrice(p)}
                      disabled={current.saving || (!isModified && !current.success)}
                      title={isModified ? 'Click to save new product price' : 'Current price saved'}
                    >
                      {current.saving ? (
                        <RefreshCw size={13} className="spinning-icon" />
                      ) : current.success ? (
                        <>
                          <Check size={13} />
                          <span>Saved!</span>
                        </>
                      ) : (
                        <>
                          <DollarSign size={13} />
                          <span>{isModified ? 'Update' : 'Saved'}</span>
                        </>
                      )}
                    </button>
                    {current.error && (
                      <div className="product-save-error" title={current.error}>
                        {current.error}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}

            {filteredProducts.length === 0 && !loading && (
              <tr>
                <td colSpan="7" className="empty-table-cell">
                  <div className="empty-state-wrap">
                    <Package size={32} />
                    <p>No products match your search or filter.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
