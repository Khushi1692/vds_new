import React, { useState } from 'react';
import { 
  Building2, Store, Plus, Edit2, Trash2, Search, Phone, 
  Mail, MapPin, CheckCircle2, AlertCircle, Save, X, UserPlus,
  Eye, EyeOff, Copy, Check, Key
} from 'lucide-react';
import { getApiUrl } from '../../../config/api';
import AddressAutocomplete from '../../../components/AddressAutocomplete/AddressAutocomplete';

export default function AdminCompanies({ 
  companies, 
  token, 
  onRefresh 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals state
  const [editingCompany, setEditingCompany] = useState(null);
  const [addingStoreToCompany, setAddingStoreToCompany] = useState(null);
  const [editingStore, setEditingStore] = useState(null); // { companyId, store }
  const [isOnboardingNew, setIsOnboardingNew] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  // Form states for new company onboarding
  const [newCompForm, setNewCompForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    companyName: '',
    companyAbn: '',
    initialStoreName: 'Main Practice',
    initialStoreAddress: '',
    initialStorePhone: '',
    initialStoreEmail: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);

  // Helper to copy text to clipboard
  const copyToClipboard = (text, fieldName) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  };

  // Helper to generate a strong random password
  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let rand = '';
    for (let i = 0; i < 6; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const generated = `VDS-${rand}2026!`;
    setNewCompForm(prev => ({ ...prev, password: generated }));
    setShowPassword(true);
  };

  // Feedback state
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  // Filtered companies
  const filteredCompanies = (companies || []).filter(c => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    return (
      c.companyName?.toLowerCase().includes(term) ||
      c.companyAbn?.toLowerCase().includes(term) ||
      c.name?.toLowerCase().includes(term) ||
      c.email?.toLowerCase().includes(term) ||
      c.stores?.some(s => s.name?.toLowerCase().includes(term) || s.address?.toLowerCase().includes(term))
    );
  });

  // 1. Update Company Details (PUT)
  const handleUpdateCompany = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback({ type: '', message: '' });

    try {
      const payload = {
        name: editingCompany.name,
        email: editingCompany.email,
        phone: editingCompany.phone,
        companyName: editingCompany.companyName,
        companyAbn: editingCompany.companyAbn
      };
      if (editingCompany.password && editingCompany.password.trim()) {
        payload.password = editingCompany.password.trim();
      }

      const res = await fetch(getApiUrl(`/api/admin/companies/${editingCompany._id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update company');

      setFeedback({ type: 'success', message: 'Company information updated successfully.' });
      setEditingCompany(null);
      setShowEditPassword(false);
      onRefresh();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // 2. Add Store to Company (POST)
  const handleAddStore = async (e) => {
    e.preventDefault();
    if (!addingStoreToCompany.name || !addingStoreToCompany.address) {
      alert('Store name and address are required.');
      return;
    }

    setSubmitting(true);
    setFeedback({ type: '', message: '' });

    try {
      const res = await fetch(getApiUrl(`/api/admin/companies/${addingStoreToCompany.companyId}/stores`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: addingStoreToCompany.name,
          address: addingStoreToCompany.address,
          contactNumber: addingStoreToCompany.contactNumber,
          email: addingStoreToCompany.email || ''
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add store');

      setFeedback({ type: 'success', message: 'New store added to company profile successfully.' });
      setAddingStoreToCompany(null);
      onRefresh();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Edit Existing Store (PUT)
  const handleEditStore = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback({ type: '', message: '' });

    try {
      const res = await fetch(getApiUrl(`/api/admin/companies/${editingStore.companyId}/stores/${editingStore.store._id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editingStore.store.name,
          address: editingStore.store.address,
          contactNumber: editingStore.store.contactNumber,
          email: editingStore.store.email || ''
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update store');

      setFeedback({ type: 'success', message: 'Store details updated successfully.' });
      setEditingStore(null);
      onRefresh();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // 4. Delete Store (DELETE)
  const handleDeleteStore = async (companyId, storeId, storeName) => {
    if (!window.confirm(`Are you sure you want to remove the store location "${storeName}"?`)) {
      return;
    }

    try {
      const res = await fetch(getApiUrl(`/api/admin/companies/${companyId}/stores/${storeId}`), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete store');

      setFeedback({ type: 'success', message: 'Store removed successfully.' });
      onRefresh();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  // 5. Onboard New Trade Company (POST)
  const handleOnboardCompany = async (e) => {
    e.preventDefault();
    if (!newCompForm.name || !newCompForm.email || !newCompForm.companyName) {
      alert('Please fill out client name, email, and company name.');
      return;
    }

    setSubmitting(true);
    setFeedback({ type: '', message: '' });

    try {
      const stores = [];
      if (newCompForm.initialStoreName && newCompForm.initialStoreAddress) {
        stores.push({
          name: newCompForm.initialStoreName,
          address: newCompForm.initialStoreAddress,
          contactNumber: newCompForm.initialStorePhone,
          email: newCompForm.initialStoreEmail || ''
        });
      }

      const assignedPassword = (newCompForm.password && newCompForm.password.trim()) ? newCompForm.password.trim() : 'VDSClient2026!';

      const res = await fetch(getApiUrl('/api/admin/companies'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newCompForm.name,
          email: newCompForm.email,
          password: assignedPassword,
          phone: newCompForm.phone,
          companyName: newCompForm.companyName,
          companyAbn: newCompForm.companyAbn,
          stores
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to onboard company');

      const portalUrl = `${window.location.origin}/login`;
      setCreatedCredentials({
        companyName: newCompForm.companyName,
        contactName: newCompForm.name,
        email: newCompForm.email.toLowerCase().trim(),
        password: data.initialPassword || assignedPassword,
        loginUrl: portalUrl
      });

      setFeedback({ type: 'success', message: `Trade partner "${newCompForm.companyName}" successfully onboarded!` });
      setIsOnboardingNew(false);
      setNewCompForm({
        name: '',
        email: '',
        password: '',
        phone: '',
        companyName: '',
        companyAbn: '',
        initialStoreName: 'Main Practice',
        initialStoreAddress: '',
        initialStorePhone: '',
        initialStoreEmail: ''
      });
      setShowPassword(false);
      onRefresh();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-companies-tab">
      {/* Top Toolbar */}
      <div className="companies-toolbar">
        <div className="search-bar-wrap">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search companies by name, ABN, contact email, or store location..."
          />
        </div>

        <button
          type="button"
          className="onboard-btn"
          onClick={() => setIsOnboardingNew(true)}
        >
          <UserPlus size={16} />
          <span>+ Onboard New Trade Partner</span>
        </button>
      </div>

      {/* Global Feedback Alert */}
      {feedback.message && (
        <div className={`feedback-banner ${feedback.type}`}>
          {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Companies List Cards */}
      <div className="companies-grid">
        {filteredCompanies.map((comp) => {
          const storesCount = comp.stores?.length || 0;

          return (
            <div key={comp._id} className="company-account-card">
              {/* Card Header */}
              <div className="comp-card-header">
                <div className="header-brand">
                  <div className="icon-cube">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <h3>{comp.companyName || 'Unassigned Trade Account'}</h3>
                    <div className="abn-chip">
                      <span>ABN: {comp.companyAbn || 'Not Provided'}</span>
                    </div>
                  </div>
                </div>

                <div className="header-actions">
                  <button
                    type="button"
                    className="edit-comp-btn"
                    onClick={() => setEditingCompany({ ...comp })}
                    title="Edit Company Details"
                  >
                    <Edit2 size={14} />
                    <span>Edit Company</span>
                  </button>
                </div>
              </div>

              {/* Contact Information */}
              <div className="comp-contact-bar">
                <div className="contact-item">
                  <span className="lbl">Primary Contact:</span>
                  <strong>{comp.name}</strong>
                </div>
                <div className="contact-item">
                  <Mail size={13} className="inline-icon" />
                  <a href={`mailto:${comp.email}`}>{comp.email}</a>
                </div>
                {comp.phone && (
                  <div className="contact-item">
                    <Phone size={13} className="inline-icon" />
                    <span>{comp.phone}</span>
                  </div>
                )}
                <div className="contact-item orders-stat">
                  <span>Total Orders:</span>
                  <span className="orders-badge">{comp.orderCount || 0}</span>
                </div>
              </div>

              {/* Multi-Stores Section */}
              <div className="comp-stores-container">
                <div className="stores-header-row">
                  <div className="stores-heading">
                    <Store size={15} />
                    <span>Designated Store Locations ({storesCount})</span>
                  </div>
                  <button
                    type="button"
                    className="add-store-quick-btn"
                    onClick={() => setAddingStoreToCompany({
                      companyId: comp._id,
                      companyName: comp.companyName || comp.name,
                      name: '',
                      address: '',
                      contactNumber: comp.phone || '',
                      email: ''
                    })}
                  >
                    <Plus size={14} />
                    <span>Add Store</span>
                  </button>
                </div>

                <div className="stores-pills-list">
                  {comp.stores?.map((store, sIdx) => (
                    <div key={store._id || sIdx} className="store-pill-card">
                      <div className="store-info-left">
                        <div className="store-pill-name">
                          <strong>{store.name || `Store #${sIdx + 1}`}</strong>
                        </div>
                        <div className="store-pill-address">
                          <MapPin size={12} className="inline-icon" />
                          <span>{store.address || 'Address pending'}</span>
                        </div>
                        {store.contactNumber && (
                          <div className="store-pill-phone">
                            <Phone size={12} className="inline-icon" />
                            <span>{store.contactNumber}</span>
                          </div>
                        )}
                        {store.email && (
                          <div className="store-pill-email">
                            <Mail size={12} className="inline-icon" />
                            <span>{store.email}</span>
                          </div>
                        )}
                      </div>

                      <div className="store-actions-right">
                        <button
                          type="button"
                          className="store-edit-btn"
                          onClick={() => setEditingStore({
                            companyId: comp._id,
                            store: { ...store }
                          })}
                          title="Edit Store"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          className="store-del-btn"
                          onClick={() => handleDeleteStore(comp._id, store._id, store.name)}
                          title="Remove Store"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {storesCount === 0 && (
                    <div className="empty-stores-hint">
                      No stores registered yet. Click "+ Add Store" to configure delivery locations.
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredCompanies.length === 0 && (
          <div className="empty-companies-box">
            <Building2 size={36} />
            <p>No trade companies match your search.</p>
          </div>
        )}
      </div>

      {/* --- MODAL 1: EDIT COMPANY DETAILS --- */}
      {editingCompany && (
        <div className="admin-modal-overlay">
          <div className="admin-form-modal">
            <div className="form-modal-header">
              <h3>Edit Company Information</h3>
              <button type="button" onClick={() => setEditingCompany(null)}><X size={18} /></button>
            </div>
            <form onSubmit={handleUpdateCompany} className="modal-inner-form">
              <div className="form-field">
                <label>Company Trading Name</label>
                <input
                  type="text"
                  value={editingCompany.companyName}
                  onChange={(e) => setEditingCompany({ ...editingCompany, companyName: e.target.value })}
                  required
                />
              </div>
              <div className="form-field">
                <label>Company ABN</label>
                <input
                  type="text"
                  value={editingCompany.companyAbn}
                  onChange={(e) => setEditingCompany({ ...editingCompany, companyAbn: e.target.value })}
                  placeholder="e.g. 84 123 456 789"
                />
              </div>
              <div className="form-field">
                <label>Primary Contact Name</label>
                <input
                  type="text"
                  value={editingCompany.name}
                  onChange={(e) => setEditingCompany({ ...editingCompany, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-field">
                <label>Email Address</label>
                <input
                  type="email"
                  value={editingCompany.email}
                  onChange={(e) => setEditingCompany({ ...editingCompany, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-field">
                <label>Contact Phone</label>
                <input
                  type="text"
                  value={editingCompany.phone || ''}
                  onChange={(e) => setEditingCompany({ ...editingCompany, phone: e.target.value })}
                  placeholder="e.g. (03) 9000 0000"
                />
              </div>

              <div className="form-field">
                <label>Reset / Change Account Password (Optional)</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type={showEditPassword ? 'text' : 'password'}
                    value={editingCompany.password || ''}
                    onChange={(e) => setEditingCompany({ ...editingCompany, password: e.target.value })}
                    placeholder="Enter new password to reset, or leave blank to keep unchanged"
                    style={{ paddingRight: '40px', width: '100%' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title={showEditPassword ? 'Hide password' : 'Show password'}
                  >
                    {showEditPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                  Setting a password here immediately updates the trade partner&apos;s login credential.
                </span>
              </div>

              <div className="form-actions-row">
                <button type="button" className="cancel-btn" onClick={() => setEditingCompany(null)}>Cancel</button>
                <button type="submit" className="save-btn" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Company Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: ADD STORE TO COMPANY --- */}
      {addingStoreToCompany && (
        <div className="admin-modal-overlay">
          <div className="admin-form-modal">
            <div className="form-modal-header">
              <h3>Add Store to {addingStoreToCompany.companyName}</h3>
              <button type="button" onClick={() => setAddingStoreToCompany(null)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAddStore} className="modal-inner-form">
              <div className="form-field">
                <label>Store / Practice Name</label>
                <input
                  type="text"
                  value={addingStoreToCompany.name}
                  onChange={(e) => setAddingStoreToCompany({ ...addingStoreToCompany, name: e.target.value })}
                  placeholder="e.g. Melbourne CBD Clinic"
                  required
                />
              </div>
              <div className="form-field">
                <label>Delivery Address *</label>
                <AddressAutocomplete
                  value={addingStoreToCompany.address}
                  onChange={(val) => setAddingStoreToCompany({ ...addingStoreToCompany, address: val })}
                  placeholder="Start typing clinic address (e.g. 45 Collins St, Melbourne)..."
                  required
                />
              </div>
              <div className="form-field">
                <label>Store Contact Number</label>
                <input
                  type="text"
                  value={addingStoreToCompany.contactNumber}
                  onChange={(e) => setAddingStoreToCompany({ ...addingStoreToCompany, contactNumber: e.target.value })}
                  placeholder="e.g. (03) 9555 1234"
                />
              </div>
              <div className="form-field">
                <label>Store Email Address</label>
                <input
                  type="email"
                  value={addingStoreToCompany.email || ''}
                  onChange={(e) => setAddingStoreToCompany({ ...addingStoreToCompany, email: e.target.value })}
                  placeholder="e.g. clinic.receiving@example.com.au"
                />
              </div>

              <div className="form-actions-row">
                <button type="button" className="cancel-btn" onClick={() => setAddingStoreToCompany(null)}>Cancel</button>
                <button type="submit" className="save-btn" disabled={submitting}>
                  {submitting ? 'Adding...' : 'Add Store'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 3: EDIT STORE --- */}
      {editingStore && (
        <div className="admin-modal-overlay">
          <div className="admin-form-modal">
            <div className="form-modal-header">
              <h3>Edit Store Details</h3>
              <button type="button" onClick={() => setEditingStore(null)}><X size={18} /></button>
            </div>
            <form onSubmit={handleEditStore} className="modal-inner-form">
              <div className="form-field">
                <label>Store / Practice Name</label>
                <input
                  type="text"
                  value={editingStore.store.name}
                  onChange={(e) => setEditingStore({
                    ...editingStore,
                    store: { ...editingStore.store, name: e.target.value }
                  })}
                  required
                />
              </div>
              <div className="form-field">
                <label>Delivery Address *</label>
                <AddressAutocomplete
                  value={editingStore.store.address}
                  onChange={(val) => setEditingStore({
                    ...editingStore,
                    store: { ...editingStore.store, address: val }
                  })}
                  placeholder="Start typing clinic address (e.g. 45 Collins St, Melbourne)..."
                  required
                />
              </div>
              <div className="form-field">
                <label>Store Contact Phone</label>
                <input
                  type="text"
                  value={editingStore.store.contactNumber || ''}
                  onChange={(e) => setEditingStore({
                    ...editingStore,
                    store: { ...editingStore.store, contactNumber: e.target.value }
                  })}
                  placeholder="e.g. (03) 9555 1234"
                />
              </div>
              <div className="form-field">
                <label>Store Email Address</label>
                <input
                  type="email"
                  value={editingStore.store.email || ''}
                  onChange={(e) => setEditingStore({
                    ...editingStore,
                    store: { ...editingStore.store, email: e.target.value }
                  })}
                  placeholder="e.g. clinic.receiving@example.com.au"
                />
              </div>

              <div className="form-actions-row">
                <button type="button" className="cancel-btn" onClick={() => setEditingStore(null)}>Cancel</button>
                <button type="submit" className="save-btn" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Store Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 4: ONBOARD NEW COMPANY --- */}
      {isOnboardingNew && (
        <div className="admin-modal-overlay">
          <div className="admin-form-modal large">
            <div className="form-modal-header">
              <h3>Onboard New Trade Partner Company</h3>
              <button type="button" onClick={() => setIsOnboardingNew(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleOnboardCompany} className="modal-inner-form">
              <div className="form-section-title">Company & Primary Contact</div>
              <div className="form-row-2col">
                <div className="form-field">
                  <label>Company Trading Name *</label>
                  <input
                    type="text"
                    value={newCompForm.companyName}
                    onChange={(e) => setNewCompForm({ ...newCompForm, companyName: e.target.value })}
                    placeholder="e.g. Apex Health Services Pty Ltd"
                    required
                  />
                </div>
                <div className="form-field">
                  <label>Company ABN</label>
                  <input
                    type="text"
                    value={newCompForm.companyAbn}
                    onChange={(e) => setNewCompForm({ ...newCompForm, companyAbn: e.target.value })}
                    placeholder="e.g. 51 824 753 556"
                  />
                </div>
              </div>

              <div className="form-row-3col">
                <div className="form-field">
                  <label>Contact Person Name *</label>
                  <input
                    type="text"
                    value={newCompForm.name}
                    onChange={(e) => setNewCompForm({ ...newCompForm, name: e.target.value })}
                    placeholder="e.g. Dr. Jane Smith"
                    required
                  />
                </div>
                <div className="form-field">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    value={newCompForm.email}
                    onChange={(e) => setNewCompForm({ ...newCompForm, email: e.target.value })}
                    placeholder="e.g. accounts@apexhealth.com.au"
                    required
                  />
                </div>
                <div className="form-field">
                  <label>Phone Number</label>
                  <input
                    type="text"
                    value={newCompForm.phone}
                    onChange={(e) => setNewCompForm({ ...newCompForm, phone: e.target.value })}
                    placeholder="e.g. (03) 9800 0000"
                  />
                </div>
              </div>

              {/* Login Credentials Section */}
              <div className="form-section-title" style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Account Login Credentials</span>
                <button
                  type="button"
                  onClick={generatePassword}
                  style={{
                    background: 'rgba(56, 189, 248, 0.12)',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                    color: '#38bdf8',
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '4px 10px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <Key size={13} /> Generate Password
                </button>
              </div>

              <div className="form-row-2col">
                <div className="form-field">
                  <label>Create Account Password *</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newCompForm.password}
                      onChange={(e) => setNewCompForm({ ...newCompForm, password: e.target.value })}
                      placeholder="e.g. TradeClient2026! (or leave blank for default)"
                      style={{ paddingRight: '40px', width: '100%' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                    Set custom password or click <strong>Generate Password</strong>. If left blank, default is <code>VDSClient2026!</code>.
                  </span>
                </div>

                <div className="form-field">
                  <label>Trade Partner Access Level</label>
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    color: '#10b981',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    minHeight: '42px',
                    boxSizing: 'border-box'
                  }}>
                    <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
                    <span>Instant full portal access upon creation. Ready to log in immediately.</span>
                  </div>
                </div>
              </div>

              <div className="form-section-title" style={{ marginTop: '16px' }}>Initial Delivery Store Location</div>
              <div className="form-row-2col">
                <div className="form-field">
                  <label>Store / Branch Name</label>
                  <input
                    type="text"
                    value={newCompForm.initialStoreName}
                    onChange={(e) => setNewCompForm({ ...newCompForm, initialStoreName: e.target.value })}
                    placeholder="e.g. Main Clinic"
                  />
                </div>
                <div className="form-field">
                  <label>Delivery Address</label>
                  <AddressAutocomplete
                    value={newCompForm.initialStoreAddress}
                    onChange={(val) => setNewCompForm({ ...newCompForm, initialStoreAddress: val })}
                    placeholder="Start typing clinic address (e.g. 100 Royal Parade, Parkville)..."
                  />
                </div>
              </div>
              <div className="form-row-2col" style={{ marginTop: '8px' }}>
                <div className="form-field">
                  <label>Store Phone Number</label>
                  <input
                    type="text"
                    value={newCompForm.initialStorePhone}
                    onChange={(e) => setNewCompForm({ ...newCompForm, initialStorePhone: e.target.value })}
                    placeholder="e.g. (03) 9345 0000"
                  />
                </div>
                <div className="form-field">
                  <label>Store Email Address</label>
                  <input
                    type="email"
                    value={newCompForm.initialStoreEmail}
                    onChange={(e) => setNewCompForm({ ...newCompForm, initialStoreEmail: e.target.value })}
                    placeholder="e.g. clinic.receiving@example.com.au"
                  />
                </div>
              </div>

              <div className="form-actions-row">
                <button type="button" className="cancel-btn" onClick={() => setIsOnboardingNew(false)}>Cancel</button>
                <button type="submit" className="save-btn" disabled={submitting}>
                  {submitting ? 'Creating Trade Account...' : 'Create Trade Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 5: CREDENTIALS CREATED & READY TO SHARE --- */}
      {createdCredentials && (
        <div className="admin-modal-overlay">
          <div className="admin-form-modal" style={{ maxWidth: '580px', border: '1px solid #10b981' }}>
            <div className="form-modal-header" style={{ borderBottom: '1px solid rgba(16, 185, 129, 0.25)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '8px', borderRadius: '8px' }}>
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h3 style={{ margin: 0, color: '#f1f5f9' }}>Trade Partner Onboarded</h3>
                  <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 500 }}>
                    Credentials active and ready to share with client
                  </span>
                </div>
              </div>
              <button type="button" onClick={() => setCreatedCredentials(null)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px 24px' }}>
              <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#94a3b8', lineHeight: 1.5 }}>
                Trade account for <strong style={{ color: '#f8fafc' }}>{createdCredentials.companyName}</strong> has been created with direct login access.
                You can copy these credentials and share them with <strong style={{ color: '#f8fafc' }}>{createdCredentials.contactName}</strong>:
              </p>

              {/* Credentials summary box */}
              <div style={{
                background: '#09101d',
                border: '1px solid #1e293b',
                borderRadius: '10px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                {/* Login Portal URL */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', fontWeight: 600 }}>
                      Login Portal URL
                    </span>
                    <span style={{ fontSize: '13px', color: '#38bdf8', fontFamily: 'monospace' }}>
                      {createdCredentials.loginUrl}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(createdCredentials.loginUrl, 'url')}
                    style={{
                      background: 'rgba(56, 189, 248, 0.1)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      color: '#38bdf8',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    {copiedField === 'url' ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy URL</>}
                  </button>
                </div>

                {/* Email */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #1e293b', paddingTop: '10px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', fontWeight: 600 }}>
                      Username / Email
                    </span>
                    <span style={{ fontSize: '14px', color: '#f8fafc', fontWeight: 600, fontFamily: 'monospace' }}>
                      {createdCredentials.email}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(createdCredentials.email, 'email')}
                    style={{
                      background: 'rgba(56, 189, 248, 0.1)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      color: '#38bdf8',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    {copiedField === 'email' ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
                  </button>
                </div>

                {/* Password */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #1e293b', paddingTop: '10px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', fontWeight: 600 }}>
                      Assigned Password
                    </span>
                    <span style={{ fontSize: '14px', color: '#10b981', fontWeight: 700, fontFamily: 'monospace', letterSpacing: '0.03em' }}>
                      {createdCredentials.password}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(createdCredentials.password, 'password')}
                    style={{
                      background: 'rgba(16, 185, 129, 0.12)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      color: '#10b981',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      fontWeight: 500
                    }}
                  >
                    {copiedField === 'password' ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy Password</>}
                  </button>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => {
                    const fullBrief = `Victoria Diagnostic Supplies - Trade Partner Portal\nAccount: ${createdCredentials.companyName}\nContact: ${createdCredentials.contactName}\nPortal URL: ${createdCredentials.loginUrl}\nEmail: ${createdCredentials.email}\nPassword: ${createdCredentials.password}\n\nYou can log in immediately to view trade catalog pricing and submit purchase orders.`;
                    copyToClipboard(fullBrief, 'all');
                  }}
                  style={{
                    background: '#1e293b',
                    border: '1px solid #334155',
                    color: '#e2e8f0',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer'
                  }}
                >
                  {copiedField === 'all' ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
                  {copiedField === 'all' ? 'Copied Full Welcome Message!' : 'Copy Full Message for Client'}
                </button>

                <button
                  type="button"
                  className="save-btn"
                  style={{ margin: 0, padding: '10px 24px' }}
                  onClick={() => setCreatedCredentials(null)}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
