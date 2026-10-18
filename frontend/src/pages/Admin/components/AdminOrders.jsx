import React, { useState, useMemo } from 'react';
import { 
  Search, Filter, Printer, Edit3, Truck, AlertCircle, 
  CheckCircle2, Clock, ChevronRight, Store, Building2, Download
} from 'lucide-react';

export default function AdminOrders({ 
  orders, 
  initialFilter = 'all', 
  onSelectOrder, 
  onOpenPrint 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialFilter);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return (orders || []).filter((order) => {
      // 1. Status Filter
      if (statusFilter !== 'all') {
        const orderStatus = order.orderStatus || 'pending_invoice';
        if (statusFilter === 'pending_invoice') {
          if (orderStatus !== 'pending_invoice') return false;
        } else if (orderStatus !== statusFilter) {
          return false;
        }
      }

      // 2. Search Filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const matchesId = order.orderId?.toLowerCase().includes(term);
        const matchesInv = order.invoiceNumber?.toLowerCase().includes(term);
        const matchesEmail = order.customerEmail?.toLowerCase().includes(term);
        const matchesName = order.customerName?.toLowerCase().includes(term);
        const matchesCompany = order.companyName?.toLowerCase().includes(term);
        const matchesPo = order.poNumber?.toLowerCase().includes(term);
        const matchesStore = order.store?.name?.toLowerCase().includes(term);
        const matchesAddr = order.store?.address?.toLowerCase().includes(term);

        if (!matchesId && !matchesInv && !matchesEmail && !matchesName && !matchesCompany && !matchesPo && !matchesStore && !matchesAddr) {
          return false;
        }
      }

      return true;
    });
  }, [orders, statusFilter, searchTerm]);

  // Counts for filter chips
  const counts = useMemo(() => {
    const c = { all: orders.length, pending: 0, issued: 0, paid: 0, dispatched: 0 };
    orders.forEach(o => {
      const s = o.orderStatus || 'pending_invoice';
      if (s === 'pending_invoice') c.pending++;
      else if (s === 'invoice_issued') c.issued++;
      else if (s === 'paid') c.paid++;
      else if (s === 'dispatched') c.dispatched++;
    });
    return c;
  }, [orders]);

  return (
    <div className="admin-orders-tab">
      {/* Search & Filter Controls */}
      <div className="orders-toolbar">
        <div className="search-bar-wrap">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Order ID, Invoice #, Company, PO #, Store name, or Email..."
          />
          {searchTerm && (
            <button type="button" className="clear-btn" onClick={() => setSearchTerm('')}>
              ×
            </button>
          )}
        </div>

        {/* Filter Chips */}
        <div className="status-chips-wrap">
          <button
            type="button"
            className={`filter-chip ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All Orders ({counts.all})
          </button>
          <button
            type="button"
            className={`filter-chip amber ${statusFilter === 'pending_invoice' ? 'active' : ''}`}
            onClick={() => setStatusFilter('pending_invoice')}
          >
            Pending Invoice ({counts.pending})
          </button>
          <button
            type="button"
            className={`filter-chip blue ${statusFilter === 'invoice_issued' ? 'active' : ''}`}
            onClick={() => setStatusFilter('invoice_issued')}
          >
            Invoice Issued ({counts.issued})
          </button>
          <button
            type="button"
            className={`filter-chip green ${statusFilter === 'paid' ? 'active' : ''}`}
            onClick={() => setStatusFilter('paid')}
          >
            Paid ({counts.paid})
          </button>
          <button
            type="button"
            className={`filter-chip purple ${statusFilter === 'dispatched' ? 'active' : ''}`}
            onClick={() => setStatusFilter('dispatched')}
          >
            Dispatched ({counts.dispatched})
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="table-responsive-container">
        <table className="admin-data-table">
          <thead>
            <tr>
              <th>Order ID & Date</th>
              <th>Trade Company & Contact</th>
              <th>Delivery Destination Store</th>
              <th>Customer PO #</th>
              <th className="text-right">Subtotal (Ex GST)</th>
              <th className="text-right">Delivery Charge</th>
              <th className="text-right">Total (Inc GST)</th>
              <th className="text-center">Status</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => {
              const status = order.orderStatus || 'pending_invoice';
              const subtotal = order.subtotalExGst || (order.totalAmount ? order.totalAmount / 100 : 0);
              const hasDelivery = order.deliveryCharge !== undefined && order.deliveryCharge > 0;
              const delivery = order.deliveryCharge || 0;
              const totalIncGst = order.finalInvoiceTotal || (subtotal * 1.1);

              return (
                <tr key={order.orderId} className={`order-row ${status}`}>
                  {/* Order ID */}
                  <td className="cell-id">
                    <strong>{order.orderId}</strong>
                    <div className="sub-date">
                      {new Date(order.createdAt).toLocaleDateString('en-AU', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </div>
                  </td>

                  {/* Company & Client */}
                  <td className="cell-client">
                    <div className="company-name">{order.companyName || 'Standard Account'}</div>
                    <div className="client-email">{order.customerEmail}</div>
                    {order.companyAbn && <div className="abn-small">ABN: {order.companyAbn}</div>}
                  </td>

                  {/* Delivery Store */}
                  <td className="cell-store">
                    <div className="store-title">
                      <Store size={13} className="inline-icon" />
                      <span>{order.store?.name || 'Main Practice'}</span>
                    </div>
                    <div className="store-address" title={order.store?.address}>
                      {order.store?.address || 'Address on file'}
                    </div>
                  </td>

                  {/* PO # */}
                  <td className="cell-po">
                    {order.poNumber ? (
                      <span className="po-tag">{order.poNumber}</span>
                    ) : (
                      <span className="no-val">-</span>
                    )}
                  </td>

                  {/* Subtotal Ex GST */}
                  <td className="cell-price text-right">
                    ${subtotal.toFixed(2)}
                  </td>

                  {/* Delivery Charge */}
                  <td className="cell-freight text-right">
                    {hasDelivery ? (
                      <span className="freight-set">${delivery.toFixed(2)}</span>
                    ) : status === 'pending_invoice' ? (
                      <span className="freight-needed" title="Calculate freight to issue invoice">
                        Needs Charge
                      </span>
                    ) : (
                      <span className="freight-free">$0.00</span>
                    )}
                  </td>

                  {/* Total Inc GST */}
                  <td className="cell-total text-right">
                    <strong>${totalIncGst.toFixed(2)}</strong>
                  </td>

                  {/* Status Badge */}
                  <td className="cell-status text-center">
                    <span className={`status-badge ${status}`}>
                      {status.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>

                  {/* Action Buttons */}
                  <td className="cell-actions text-center">
                    <div className="table-actions-row">
                      <button
                        type="button"
                        className="tbl-action-btn primary"
                        onClick={() => onSelectOrder(order)}
                        title="Manage Order & Finalize Invoice"
                      >
                        <Edit3 size={15} />
                        <span>Manage</span>
                      </button>

                      <button
                        type="button"
                        className="tbl-action-btn print"
                        onClick={() => onOpenPrint(order)}
                        title="Print Official Tax Invoice"
                      >
                        <Printer size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {filteredOrders.length === 0 && (
              <tr>
                <td colSpan="9" className="empty-table-cell">
                  <div className="empty-state-wrap">
                    <AlertCircle size={32} />
                    <p>No orders match your current filter and search criteria.</p>
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
