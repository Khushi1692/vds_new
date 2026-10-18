import { useContext, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Building2, 
  Store, 
  MapPin, 
  Phone, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Copy, 
  ExternalLink, 
  Package, 
  FileText, 
  X, 
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import Button from '../../components/Button/Button';
import './Profile.css';

export default function Profile() {
  const { user, token, updateUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [copiedAbn, setCopiedAbn] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Modal state for Add/Edit Store
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null); // null = adding new store
  const [storeForm, setStoreForm] = useState({ name: '', address: '', contactNumber: '' });
  const [saving, setSaving] = useState(false);

  // Modal state for Edit Company
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [companyForm, setCompanyForm] = useState({ companyName: '', companyAbn: '' });

  useEffect(() => {
    document.title = "Company Profile & Stores | Victoria Diagnostic Supplies";
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!user && !token) {
      navigate('/login', { state: { from: location } });
    }
  }, [user, token, navigate, location]);

  if (!user) {
    return (
      <main className="profile-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <p style={{ color: 'var(--ink-soft)' }}>Loading profile...</p>
      </main>
    );
  }

  const stores = user.stores || [];
  const userInitial = user.name ? user.name.charAt(0).toUpperCase() : 'U';

  const handleCopyAbn = () => {
    if (user.companyAbn) {
      navigator.clipboard.writeText(user.companyAbn);
      setCopiedAbn(true);
      setTimeout(() => setCopiedAbn(false), 2000);
    }
  };

  // Open modal to add a new store
  const handleOpenAddStore = () => {
    setEditingIndex(null);
    setStoreForm({ name: '', address: '', contactNumber: '' });
    setErrorMessage('');
    setIsModalOpen(true);
  };

  // Open modal to edit existing store
  const handleOpenEditStore = (index) => {
    setEditingIndex(index);
    const target = stores[index] || {};
    setStoreForm({
      name: target.name || '',
      address: target.address || '',
      contactNumber: target.contactNumber || target.phone || ''
    });
    setErrorMessage('');
    setIsModalOpen(true);
  };

  // Open modal to edit company info
  const handleOpenEditCompany = () => {
    setCompanyForm({
      companyName: user.companyName || '',
      companyAbn: user.companyAbn || ''
    });
    setErrorMessage('');
    setIsCompanyModalOpen(true);
  };

  // Save Store (Add or Edit)
  const handleSaveStore = async (e) => {
    e.preventDefault();
    if (!storeForm.name.trim() || !storeForm.address.trim()) {
      setErrorMessage('Store Name and Address are required.');
      return;
    }

    setSaving(true);
    setErrorMessage('');

    const updatedStores = [...stores];
    if (editingIndex !== null) {
      updatedStores[editingIndex] = {
        ...updatedStores[editingIndex],
        name: storeForm.name.trim(),
        address: storeForm.address.trim(),
        contactNumber: storeForm.contactNumber.trim()
      };
    } else {
      updatedStores.push({
        name: storeForm.name.trim(),
        address: storeForm.address.trim(),
        contactNumber: storeForm.contactNumber.trim()
      });
    }

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ stores: updatedStores })
      });
      const data = await res.json();

      if (res.ok) {
        updateUser(data.user);
        setIsModalOpen(false);
        setSuccessMessage(editingIndex !== null ? 'Store updated successfully.' : 'New store added successfully.');
        setTimeout(() => setSuccessMessage(''), 3500);
      } else {
        setErrorMessage(data.error || 'Failed to update store.');
      }
    } catch (err) {
      setErrorMessage('Error communicating with server.');
    } finally {
      setSaving(false);
    }
  };

  // Delete Store
  const handleDeleteStore = async (index) => {
    if (!window.confirm(`Are you sure you want to remove ${stores[index]?.name || 'this store'}?`)) {
      return;
    }

    const updatedStores = stores.filter((_, i) => i !== index);

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ stores: updatedStores })
      });
      const data = await res.json();

      if (res.ok) {
        updateUser(data.user);
        setSuccessMessage('Store removed.');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage(data.error || 'Failed to remove store.');
      }
    } catch (err) {
      setErrorMessage('Error communicating with server.');
    }
  };

  // Save Company Details
  const handleSaveCompany = async (e) => {
    e.preventDefault();
    if (!companyForm.companyName.trim()) {
      setErrorMessage('Company Name is required.');
      return;
    }

    setSaving(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          companyName: companyForm.companyName.trim(),
          companyAbn: companyForm.companyAbn.trim()
        })
      });
      const data = await res.json();

      if (res.ok) {
        updateUser(data.user);
        setIsCompanyModalOpen(false);
        setSuccessMessage('Company details updated.');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage(data.error || 'Failed to update company.');
      }
    } catch (err) {
      setErrorMessage('Error communicating with server.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="profile-page">
      {/* Hero Banner */}
      <section className="profile-hero">
        <div className="profile-hero__container">
          <div className="profile-hero__user">
            <div className="profile-hero__avatar">
              {userInitial}
            </div>
            <div>
              <h1 className="profile-hero__title">{user.name}</h1>
              <div className="profile-hero__meta">
                <span>{user.email}</span>
                <span className="profile-badge profile-badge--success">
                  <ShieldCheck size={14} /> Verified Trade Account
                </span>
                <span className="profile-badge">
                  <Store size={14} /> {stores.length} {stores.length === 1 ? 'Store' : 'Stores'}
                </span>
              </div>
            </div>
          </div>

          <div className="profile-hero__actions">
            <Link to="/orders">
              <Button variant="secondary" size="md">
                <Package size={16} /> My Orders
              </Button>
            </Link>
            <Link to="/request-quote">
              <Button variant="primary" size="md">
                <FileText size={16} /> Request Quote
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <div className="profile-main">
        {/* Left Column: Company & Account Info */}
        <aside className="profile-card">
          <div className="profile-card__header">
            <h2 className="profile-card__title">
              <Building2 size={20} /> Company Profile
            </h2>
            <button 
              type="button" 
              className="profile-tile-btn"
              onClick={handleOpenEditCompany}
              title="Edit Company Details"
            >
              <Edit3 size={15} /> Edit
            </button>
          </div>

          {successMessage && (
            <div className="profile-toast">
              <CheckCircle2 size={18} />
              <span>{successMessage}</span>
            </div>
          )}

          <div className="profile-info-list">
            <div className="profile-info-item">
              <span className="profile-info-label">Company Name</span>
              <div className="profile-info-value">
                {user.companyName || <em style={{ color: 'var(--ink-soft)', fontWeight: 400 }}>Not set</em>}
              </div>
            </div>

            <div className="profile-info-item">
              <span className="profile-info-label">Company ABN</span>
              <div className="profile-info-value">
                <span>{user.companyAbn || <em style={{ color: 'var(--ink-soft)', fontWeight: 400 }}>Not set</em>}</span>
                {user.companyAbn && (
                  <button 
                    type="button" 
                    className="profile-copy-btn"
                    onClick={handleCopyAbn}
                  >
                    <Copy size={13} /> {copiedAbn ? 'Copied!' : 'Copy'}
                  </button>
                )}
              </div>
            </div>

            <div className="profile-info-item">
              <span className="profile-info-label">Primary Contact Person</span>
              <div className="profile-info-value">{user.name}</div>
            </div>

            <div className="profile-info-item">
              <span className="profile-info-label">Primary Email</span>
              <div className="profile-info-value">{user.email}</div>
            </div>

            <div className="profile-info-item">
              <span className="profile-info-label">Account Verification</span>
              <div className="profile-info-value">
                <span style={{ color: '#4ade80', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <CheckCircle2 size={15} /> Active Clinical Partner
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* Right Column: Stores / Branches */}
        <section className="profile-card">
          <div className="profile-stores-header">
            <div>
              <h2 className="profile-card__title">
                <Store size={20} /> Registered Stores & Branches ({stores.length})
              </h2>
              <p style={{ margin: '4px 0 0', color: 'var(--ink-soft)', fontSize: '0.85rem' }}>
                Manage all practice, warehouse, and clinic locations linked to this company.
              </p>
            </div>
            <Button variant="primary" size="sm" onClick={handleOpenAddStore}>
              <Plus size={16} /> Add Store
            </Button>
          </div>

          {stores.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px' }}>
              <Store size={36} color="var(--blue)" style={{ margin: '0 auto 12px', opacity: 0.7 }} />
              <p style={{ fontWeight: 600, color: 'var(--ink)', marginBottom: '6px' }}>No stores registered yet</p>
              <p style={{ color: 'var(--ink-soft)', fontSize: '0.9rem', marginBottom: '16px' }}>
                Add your clinic or facility locations to simplify order delivery and quotes.
              </p>
              <Button variant="primary" size="md" onClick={handleOpenAddStore}>
                <Plus size={16} /> Add Your First Store
              </Button>
            </div>
          ) : (
            <div className="profile-stores-grid">
              {stores.map((store, index) => (
                <div key={store._id || index} className="profile-store-tile">
                  <div className="profile-store-tile__header">
                    <h3 className="profile-store-tile__name">{store.name}</h3>
                    <span className="profile-store-tile__badge">Store #{index + 1}</span>
                  </div>

                  <div className="profile-store-tile__detail">
                    <MapPin size={16} />
                    <span>{store.address || 'No address provided'}</span>
                  </div>

                  {store.contactNumber && (
                    <div className="profile-store-tile__detail profile-store-tile__phone">
                      <Phone size={16} />
                      <a href={`tel:${store.contactNumber}`}>{store.contactNumber}</a>
                    </div>
                  )}

                  <div className="profile-store-tile__actions">
                    <button
                      type="button"
                      className="profile-tile-btn"
                      onClick={() => handleOpenEditStore(index)}
                    >
                      <Edit3 size={14} /> Edit
                    </button>
                    <button
                      type="button"
                      className="profile-tile-btn profile-tile-btn--danger"
                      onClick={() => handleDeleteStore(index)}
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* MODAL: Add / Edit Store */}
      {isModalOpen && (
        <div className="profile-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal__header">
              <h3 className="profile-modal__title">
                {editingIndex !== null ? 'Edit Store Location' : 'Add Store Location'}
              </h3>
              <button 
                type="button" 
                className="profile-modal__close"
                onClick={() => setIsModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            {errorMessage && (
              <div className="auth-error" style={{ marginBottom: '1rem' }}>
                <AlertCircle size={16} />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSaveStore} className="profile-modal__form">
              <div className="auth-input-group">
                <label htmlFor="modal-store-name">Store Name <span className="req">*</span></label>
                <input
                  type="text"
                  id="modal-store-name"
                  value={storeForm.name}
                  onChange={(e) => setStoreForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Melbourne CBD Branch"
                  required
                  autoFocus
                />
              </div>

              <div className="auth-input-group">
                <label htmlFor="modal-store-phone">Store Contact Number</label>
                <input
                  type="tel"
                  id="modal-store-phone"
                  value={storeForm.contactNumber}
                  onChange={(e) => setStoreForm(prev => ({ ...prev, contactNumber: e.target.value }))}
                  placeholder="e.g. (03) 9123 4567"
                />
              </div>

              <div className="auth-input-group">
                <label htmlFor="modal-store-address">Store Address <span className="req">*</span></label>
                <input
                  type="text"
                  id="modal-store-address"
                  value={storeForm.address}
                  onChange={(e) => setStoreForm(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="e.g. 120 Collins Street, Melbourne VIC 3000"
                  required
                />
              </div>

              <div className="profile-modal__actions">
                <Button 
                  type="button" 
                  variant="secondary" 
                  size="md" 
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="primary" 
                  size="md" 
                  disabled={saving}
                >
                  {saving ? 'Saving...' : editingIndex !== null ? 'Update Store' : 'Add Store'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Company Info */}
      {isCompanyModalOpen && (
        <div className="profile-modal-overlay" onClick={() => setIsCompanyModalOpen(false)}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal__header">
              <h3 className="profile-modal__title">Edit Company Details</h3>
              <button 
                type="button" 
                className="profile-modal__close"
                onClick={() => setIsCompanyModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            {errorMessage && (
              <div className="auth-error" style={{ marginBottom: '1rem' }}>
                <AlertCircle size={16} />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSaveCompany} className="profile-modal__form">
              <div className="auth-input-group">
                <label htmlFor="modal-company-name">Company Name <span className="req">*</span></label>
                <input
                  type="text"
                  id="modal-company-name"
                  value={companyForm.companyName}
                  onChange={(e) => setCompanyForm(prev => ({ ...prev, companyName: e.target.value }))}
                  placeholder="e.g. Victoria Radiology Group"
                  required
                  autoFocus
                />
              </div>

              <div className="auth-input-group">
                <label htmlFor="modal-company-abn">Company ABN Number</label>
                <input
                  type="text"
                  id="modal-company-abn"
                  value={companyForm.companyAbn}
                  onChange={(e) => setCompanyForm(prev => ({ ...prev, companyAbn: e.target.value }))}
                  placeholder="11-digit ABN"
                />
              </div>

              <div className="profile-modal__actions">
                <Button 
                  type="button" 
                  variant="secondary" 
                  size="md" 
                  onClick={() => setIsCompanyModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="primary" 
                  size="md" 
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
