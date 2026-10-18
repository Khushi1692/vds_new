import React, { useState } from 'react';
import { MessageSquare, Clock, Building2, MapPin, Phone, Mail, CheckCircle2, ChevronDown } from 'lucide-react';

export default function AdminQuotes({ quotes, token, onRefresh }) {
  const [filter, setFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);

  const filteredQuotes = (quotes || []).filter(q => {
    if (filter === 'all') return true;
    return (q.status || 'pending') === filter;
  });

  const handleStatusChange = async (quoteId, newStatus) => {
    setUpdatingId(quoteId);
    try {
      const res = await fetch(`http://localhost:3001/api/admin/quotes/${quoteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error('Failed to update quote status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="admin-quotes-tab">
      <div className="quotes-toolbar">
        <div className="filter-chips">
          <button
            type="button"
            className={`filter-chip ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Quotes ({quotes.length})
          </button>
          <button
            type="button"
            className={`filter-chip amber ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pending ({quotes.filter(q => (q.status || 'pending') === 'pending').length})
          </button>
          <button
            type="button"
            className={`filter-chip blue ${filter === 'quoted' ? 'active' : ''}`}
            onClick={() => setFilter('quoted')}
          >
            Quoted ({quotes.filter(q => q.status === 'quoted').length})
          </button>
          <button
            type="button"
            className={`filter-chip green ${filter === 'closed' ? 'active' : ''}`}
            onClick={() => setFilter('closed')}
          >
            Closed ({quotes.filter(q => q.status === 'closed').length})
          </button>
        </div>
      </div>

      <div className="quotes-cards-grid">
        {filteredQuotes.map((q) => {
          const status = q.status || 'pending';
          return (
            <div key={q.quoteId} className={`quote-inquiry-card ${status}`}>
              <div className="quote-header">
                <div>
                  <div className="quote-id">{q.quoteId}</div>
                  <div className="quote-date">
                    <Clock size={12} />
                    <span>{new Date(q.createdAt).toLocaleDateString('en-AU')}</span>
                  </div>
                </div>

                <div className="status-dropdown-wrap">
                  <select
                    value={status}
                    onChange={(e) => handleStatusChange(q.quoteId, e.target.value)}
                    disabled={updatingId === q.quoteId}
                    className={`status-select ${status}`}
                  >
                    <option value="pending">Pending</option>
                    <option value="contacted">Contacted</option>
                    <option value="quoted">Quoted</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              <div className="quote-body">
                <div className="quote-contact-row">
                  <strong>{q.name}</strong>
                  {q.facility && <span>({q.facility})</span>}
                </div>
                <div className="contact-details-line">
                  <a href={`mailto:${q.email}`}><Mail size={12} /> {q.email}</a>
                  {q.phone && <span><Phone size={12} /> {q.phone}</span>}
                </div>

                {q.address && (
                  <div className="quote-address-line">
                    <MapPin size={12} />
                    <span>{q.address}</span>
                  </div>
                )}

                {/* Items List */}
                {q.items && q.items.length > 0 && (
                  <div className="quote-items-summary">
                    <span className="items-title">Requested Items:</span>
                    <ul>
                      {q.items.map((it, idx) => (
                        <li key={idx}>
                          <strong>{it.quantity}x</strong> Product ID: {it.productId}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Message */}
                {q.message && (
                  <div className="quote-message-box">
                    <span className="msg-title">Customer Message:</span>
                    <p>{q.message}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filteredQuotes.length === 0 && (
          <div className="empty-quotes-box">
            <MessageSquare size={32} />
            <p>No quote inquiries found in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
}
