import React, { useState } from 'react';
import { 
  Building2, Store, Plus, Edit2, Trash2, Search, Phone, 
  Mail, MapPin, CheckCircle2, AlertCircle, Save, X, UserPlus
} from 'lucide-react';

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

  // Form states for new company onboarding
  const [newCompForm, setNewCompForm] = useState({
    name: '',
    email: '',
    phone: '',
    companyName: '',
    companyAbn: '',
    initialStoreName: 'Main Practice',
    initialStoreAddress: '',
    initialStorePhone: ''
  });

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
      const res = await fetch(`http://localhost:3001/api/admin/companies/${editingCompany._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editingCompany.name,
          email: editingCompany.email,
          phone: editingCompany.phone,
          companyName: editingCompany.companyName,
          companyAbn: editingCompany.companyAbn
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update company');

      setFeedback({ type: 'success', message: 'Company information updated successfully.' });
      setEditingCompany(null);
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
      const res = await fetch(`http://localhost:3001/api/admin/companies/${addingStoreToCompany.companyId}/stores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: addingStoreToCompany.name,
          address: addingStoreToCompany.address,
          contactNumber: addingStoreToCompany.contactNumber
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
      const res = await fetch(`http://localhost:3001/api/admin/companies/${editingStore.companyId}/stores/${editingStore.store._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editingStore.store.name,
          address: editingStore.store.address,
          contactNumber: editingStore.store.contactNumber
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
      const res = await fetch(`http://localhost:3001/api/admin/companies/${companyId}/stores/${storeId}`, {
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
          contactNumber: newCompForm.initialStorePhone
        });
      }

      const res = await fetch('http://localhost:3001/api/admin/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newCompForm.name,
          email: newCompForm.email,
          phone: newCompForm.phone,
          companyName: newCompForm.companyName,
          companyAbn: newCompForm.companyAbn,
          stores
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to onboard company');

      setFeedback({ type: 'success', message: `Trade partner "${newCompForm.companyName}" successfully onboarded!` });
      setIsOnboardingNew(false);
      setNewCompForm({
        name: '',
        email: '',
        phone: '',
        companyName: '',
        companyAbn: '',
        initialStoreName: 'Main Practice',
        initialStoreAddress: '',
        initialStorePhone: ''
      });
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
                      companyName: comp.companyName,
                      name: '',
                      address: '',
                      contactNumber: comp.phone || ''
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
                <label>Delivery Address</label>
                <input
                  type="text"
                  value={addingStoreToCompany.address}
                  onChange={(e) => setAddingStoreToCompany({ ...addingStoreToCompany, address: e.target.value })}
                  placeholder="e.g. Level 2, 45 Collins St, Melbourne VIC 3000"
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
                <label>Delivery Address</label>
                <input
                  type="text"
                  value={editingStore.store.address}
                  onChange={(e) => setEditingStore({
                    ...editingStore,
                    store: { ...editingStore.store, address: e.target.value }
                  })}
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

              <div className="form-section-title" style={{ marginTop: '16px' }}>Initial Delivery Store Location</div>
              <div className="form-row-3col">
                <div className="form-field">
                  <label>Store / Branch Name</label>
                  <input
                    type="text"
                    value={newCompForm.initialStoreName}
                    onChange={(e) => setNewCompForm({ ...newCompForm, initialStoreName: e.target.value })}
                    placeholder="e.g. Main Clinic"
                  />
                </div>
                <div className="form-field" style={{ gridColumn: 'span 2' }}>
                  <label>Delivery Address</label>
                  <input
                    type="text"
                    value={newCompForm.initialStoreAddress}
                    onChange={(e) => setNewCompForm({ ...newCompForm, initialStoreAddress: e.target.value })}
                    placeholder="e.g. 100 Royal Parade, Parkville VIC 3052"
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
    </div>
  );
}
