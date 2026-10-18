import { useState, useContext, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Building2, 
  Store, 
  MapPin, 
  Phone, 
  FileText, 
  ShieldAlert, 
  ShieldCheck, 
  Truck, 
  ArrowLeft, 
  CheckCircle2, 
  Plus, 
  AlertCircle 
} from 'lucide-react';
import { CartContext } from '../../context/CartContext';
import { AuthContext } from '../../context/AuthContext';
import Button from '../../components/Button/Button';
import './Checkout.css';

export default function Checkout() {
  const { cartItems, clearCart } = useContext(CartContext);
  const { user, token, updateUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const userStores = user?.stores || [];

  // Store selection state: index of store in userStores, or 'custom'
  const [selectedStoreIndex, setSelectedStoreIndex] = useState(
    userStores.length > 0 ? 0 : 'custom'
  );

  // Custom / new store details
  const [customStore, setCustomStore] = useState({
    name: '',
    address: '',
    contactNumber: ''
  });
  const [saveStoreToProfile, setSaveStoreToProfile] = useState(true);

  // Logistics & Reference details
  const [poNumber, setPoNumber] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [contactPhone, setContactPhone] = useState(
    userStores[0]?.contactNumber || ''
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = "Final Tax Invoice Request | Victoria Diagnostic Supplies";
    window.scrollTo(0, 0);

    if (!user && !token) {
      navigate('/login', { state: { from: location } });
    }
  }, [user, token, navigate, location]);

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => {
      let price = typeof item.product?.price === 'number' && !isNaN(item.product.price) ? item.product.price : null;
      if (price === null && item.product?.priceLabel) {
        const firstPart = item.product.priceLabel.split('/')[0];
        price = parseFloat(firstPart.replace(/[^0-9.]/g, ''));
      }
      return total + (isNaN(price) || price === null ? 0 : price * item.quantity);
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const estimatedGst = subtotal * 0.10;

  // Determine active delivery store object
  const getActiveStore = () => {
    if (selectedStoreIndex !== 'custom' && userStores[selectedStoreIndex]) {
      return userStores[selectedStoreIndex];
    }
    return customStore;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const activeStore = getActiveStore();
    if (!activeStore.name?.trim() || !activeStore.address?.trim()) {
      setError('Please select or specify a valid delivery store name and address.');
      return;
    }

    setLoading(true);

    try {
      const itemsPayload = cartItems.map(item => ({
        productId: item.product.id,
        quantity: item.quantity
      }));

      const res = await fetch('/api/checkout/invoice-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items: itemsPayload,
          store: {
            name: activeStore.name.trim(),
            address: activeStore.address.trim(),
            contactNumber: (activeStore.contactNumber || contactPhone).trim()
          },
          poNumber: poNumber.trim(),
          specialInstructions: specialInstructions.trim(),
          contactPhone: contactPhone.trim()
        })
      });

      const data = await res.json();

      if (res.ok) {
        // If a new store was entered and user requested to save it to their profile:
        if (selectedStoreIndex === 'custom' && saveStoreToProfile && customStore.name.trim()) {
          try {
            const updatedStores = [...userStores, {
              name: customStore.name.trim(),
              address: customStore.address.trim(),
              contactNumber: customStore.contactNumber.trim()
            }];
            const profileRes = await fetch('/api/user/profile', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ stores: updatedStores })
            });
            const profileData = await profileRes.json();
            if (profileRes.ok && profileData.user) {
              updateUser(profileData.user);
            }
          } catch (profileErr) {
            console.warn('Could not save store to profile:', profileErr);
          }
        }

        clearCart();
        navigate(`/success?type=invoice&orderId=${data.orderId}&store=${encodeURIComponent(activeStore.name.trim())}`);
      } else {
        setError(data.error || 'Failed to submit invoice request. Please try again.');
      }
    } catch (err) {
      setError('Service unavailable. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  if (cartItems.length === 0) {
    return (
      <main className="checkout-page">
        <div className="checkout-container" style={{ textAlign: 'center', padding: '80px 0' }}>
          <h2>Your Cart is Empty</h2>
          <p style={{ color: 'var(--ink-soft)', margin: '12px 0 24px' }}>
            There are no items to checkout. Add medical supplies from our catalog first.
          </p>
          <Button as={Link} to="/products" variant="primary" icon={ArrowLeft}>
            Browse Range
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="checkout-page">
      <div className="checkout-container">
        {/* Breadcrumb & Header */}
        <header className="checkout-header">
          <div className="checkout-crumbs">
            <Link to="/">Home</Link>
            <span>/</span>
            <Link to="/cart">Cart</Link>
            <span>/</span>
            <span>Final Invoice Checkout</span>
          </div>
          <h1 className="checkout-title">Final Tax Invoice Request</h1>
          <p className="checkout-subtitle">
            B2B Purchase Order submission with freight calculation and official tax invoice dispatch.
          </p>
        </header>

        {/* Pricing & GST Notice Callout */}
        <div className="checkout-notice-banner" role="region" aria-label="Pricing Policy Notice">
          <ShieldAlert size={26} />
          <div>
            <strong>B2B Pricing & Consolidated Delivery Policy</strong>
            <p>
              All product prices are <strong>strictly exclusive of GST (10%) and delivery charges</strong>. 
              <strong> There is no per-item delivery charge</strong> — freight is calculated as a <strong>single consolidated fee for your entire order</strong> based on your store's location and parcel volume. 
              No upfront card payment is required now. Once you select your delivery store and submit this order, 
              our logistics team calculates the single freight fee and issues your official 
              <strong> Final Tax Invoice with GST and delivery charges itemised</strong>.
            </p>
          </div>
        </div>

        {error && (
          <div className="checkout-error" role="alert">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="checkout-grid">
          {/* Left Column: Store Selection & Order Details */}
          <div className="checkout-main-col">
            {/* PANEL 1: Select Delivery Store */}
            <div className="checkout-panel">
              <h2 className="checkout-panel__title">
                <Store size={20} /> Select Delivery Store / Branch Location
              </h2>

              {userStores.length > 0 && (
                <div className="checkout-stores-group">
                  {userStores.map((store, index) => {
                    const isSelected = selectedStoreIndex === index;
                    return (
                      <label 
                        key={store._id || index} 
                        className={`checkout-store-option ${isSelected ? 'checkout-store-option--selected' : ''}`}
                      >
                        <input
                          type="radio"
                          name="deliveryStore"
                          className="checkout-store-radio"
                          checked={isSelected}
                          onChange={() => {
                            setSelectedStoreIndex(index);
                            if (store.contactNumber) setContactPhone(store.contactNumber);
                          }}
                        />
                        <div className="checkout-store-info">
                          <div className="checkout-store-info__top">
                            <span className="checkout-store-name">{store.name}</span>
                            <span className="checkout-store-badge">Store #{index + 1}</span>
                          </div>
                          <div className="checkout-store-address">
                            <MapPin size={15} />
                            <span>{store.address}</span>
                          </div>
                          {store.contactNumber && (
                            <div className="checkout-store-phone">
                              <Phone size={14} />
                              <span>{store.contactNumber}</span>
                            </div>
                          )}
                        </div>
                      </label>
                    );
                  })}

                  {/* Option to enter a custom store / branch */}
                  <label className={`checkout-store-option ${selectedStoreIndex === 'custom' ? 'checkout-store-option--selected' : ''}`}>
                    <input
                      type="radio"
                      name="deliveryStore"
                      className="checkout-store-radio"
                      checked={selectedStoreIndex === 'custom'}
                      onChange={() => setSelectedStoreIndex('custom')}
                    />
                    <div className="checkout-store-info">
                      <div className="checkout-store-info__top">
                        <span className="checkout-store-name" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Plus size={16} /> Deliver to another branch / address
                        </span>
                        <span className="checkout-store-badge" style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--ink)' }}>
                          New Location
                        </span>
                      </div>
                      <div className="checkout-store-address">
                        <span>Enter specific clinic, surgery, or hospital delivery address</span>
                      </div>
                    </div>
                  </label>
                </div>
              )}

              {/* Custom Store Input Fields (Shown if selected or user has no saved stores) */}
              {(selectedStoreIndex === 'custom' || userStores.length === 0) && (
                <div className="checkout-custom-store-box">
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0, color: 'var(--cyan)' }}>
                    Enter Delivery Store Details
                  </h3>

                  <div className="checkout-input-row">
                    <div className="checkout-input-group" style={{ margin: 0 }}>
                      <label htmlFor="custom-store-name">Store / Clinic Name <span className="req">*</span></label>
                      <input
                        type="text"
                        id="custom-store-name"
                        value={customStore.name}
                        onChange={(e) => setCustomStore(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g. Richmond Radiology Clinic"
                        required={selectedStoreIndex === 'custom'}
                      />
                    </div>
                    <div className="checkout-input-group" style={{ margin: 0 }}>
                      <label htmlFor="custom-store-phone">Store Contact Phone</label>
                      <input
                        type="tel"
                        id="custom-store-phone"
                        value={customStore.contactNumber}
                        onChange={(e) => setCustomStore(prev => ({ ...prev, contactNumber: e.target.value }))}
                        placeholder="e.g. (03) 9429 8800"
                      />
                    </div>
                  </div>

                  <div className="checkout-input-group" style={{ margin: 0 }}>
                    <label htmlFor="custom-store-address">Store Delivery Address <span className="req">*</span></label>
                    <input
                      type="text"
                      id="custom-store-address"
                      value={customStore.address}
                      onChange={(e) => setCustomStore(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="e.g. Suite 2, 45 Bridge Road, Richmond VIC 3121"
                      required={selectedStoreIndex === 'custom'}
                    />
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--ink-soft)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={saveStoreToProfile}
                      onChange={(e) => setSaveStoreToProfile(e.target.checked)}
                      style={{ accentColor: 'var(--cyan)' }}
                    />
                    <span>Save this store location to my company profile for future orders</span>
                  </label>
                </div>
              )}
            </div>

            {/* PANEL 2: Company & Order Reference */}
            <div className="checkout-panel">
              <h2 className="checkout-panel__title">
                <Building2 size={20} /> Company & Order Information
              </h2>

              <div className="checkout-input-row">
                <div className="checkout-input-group">
                  <label>Company Name</label>
                  <input
                    type="text"
                    value={user.companyName || 'Not specified'}
                    disabled
                    style={{ opacity: 0.85, cursor: 'not-allowed' }}
                  />
                </div>
                <div className="checkout-input-group">
                  <label>Company ABN</label>
                  <input
                    type="text"
                    value={user.companyAbn || 'Not specified'}
                    disabled
                    style={{ opacity: 0.85, cursor: 'not-allowed' }}
                  />
                </div>
              </div>

              <div className="checkout-input-row">
                <div className="checkout-input-group">
                  <label htmlFor="po-number">Purchase Order (PO) Number (Optional)</label>
                  <input
                    type="text"
                    id="po-number"
                    value={poNumber}
                    onChange={(e) => setPoNumber(e.target.value)}
                    placeholder="e.g. PO-2026-4891"
                  />
                </div>
                <div className="checkout-input-group">
                  <label htmlFor="contact-phone">Contact Phone for Delivery Notification</label>
                  <input
                    type="tel"
                    id="contact-phone"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="e.g. (03) 9123 4567 or 0400 000 000"
                  />
                </div>
              </div>

              <div className="checkout-input-group" style={{ margin: 0 }}>
                <label htmlFor="special-instructions">Delivery Instructions / Access Notes (Optional)</label>
                <textarea
                  id="special-instructions"
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="e.g. Deliver to Goods Inwards at rear dock. Contact radiology reception on arrival."
                />
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary & Invoice Dispatch */}
          <aside className="checkout-summary-col">
            <div className="checkout-summary-card">
              <h2 className="checkout-summary-title">Order Summary ({cartItems.length} Lines)</h2>

              {/* Items List */}
              <div className="checkout-items-list">
                {cartItems.map((item) => (
                  <div key={item.product.id} className="checkout-item-row">
                    <div className="checkout-item-img">
                      <img 
                        src={item.product.image?.replace(/\.(png|jpe?g)$/i, '.webp')} 
                        alt={item.product.name} 
                        loading="lazy"
                      />
                    </div>
                    <div className="checkout-item-meta">
                      <div className="checkout-item-name" title={item.product.name}>
                        {item.product.name}
                      </div>
                      <div className="checkout-item-qty">
                        Qty: {item.quantity} · {item.product.sku}
                      </div>
                    </div>
                    <div className="checkout-item-price">
                      ${((item.product.price || 0) * item.quantity).toFixed(2)}
                      <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--ink-soft)', fontWeight: 400 }}>
                        ex GST
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Calculations Breakdown */}
              <div className="checkout-breakdown">
                <div className="checkout-calc-row">
                  <span>Subtotal (Excl. GST & Delivery)</span>
                  <strong>${subtotal.toFixed(2)}</strong>
                </div>

                <div className="checkout-calc-row">
                  <span>
                    Estimated GST (10%)
                    <span className="checkout-calc-tag checkout-calc-tag--blue">Itemised on Invoice</span>
                  </span>
                  <span style={{ color: 'var(--cyan)' }}>+${estimatedGst.toFixed(2)}</span>
                </div>

                <div className="checkout-calc-row">
                  <span>
                    Delivery Charge (Entire Order)
                    <span className="checkout-calc-tag checkout-calc-tag--blue">Single Consolidated Fee</span>
                  </span>
                  <span style={{ color: '#fbbf24', fontStyle: 'italic', fontSize: '0.85rem' }}>
                    Calculated on Final Invoice
                  </span>
                </div>

                <div className="checkout-total-row">
                  <div>
                    <span className="checkout-total-label">Subtotal Excl. Freight</span>
                    <span className="checkout-total-subtext">
                      + Single order freight & 10% GST added on Final Invoice
                    </span>
                  </div>
                  <span className="checkout-total-val">${subtotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                variant="primary" 
                size="lg" 
                className="checkout-submit-btn"
                disabled={loading}
              >
                <FileText size={18} />
                <span>{loading ? 'Submitting Order...' : 'Ask for Final Tax Invoice'}</span>
              </Button>

              <div className="checkout-guarantees">
                <div className="checkout-guarantee-item">
                  <CheckCircle2 size={15} />
                  <span>No card payment required upfront</span>
                </div>
                <div className="checkout-guarantee-item">
                  <Truck size={15} />
                  <span>Single consolidated delivery fee for the entire order</span>
                </div>
                <div className="checkout-guarantee-item">
                  <ShieldCheck size={15} />
                  <span>Official Australian Tax Invoice with ABN delivered to email</span>
                </div>
              </div>
            </div>
          </aside>
        </form>
      </div>
    </main>
  );
}
