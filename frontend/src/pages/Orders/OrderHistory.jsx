import { useState, useEffect, useContext, useCallback } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { fetchProducts } from '../../data/products';
import Button from '../../components/Button/Button';
import OrderDetailsModal from '../../components/OrderDetailsModal/OrderDetailsModal';
import ClientPaymentModal from '../../components/ClientPaymentModal/ClientPaymentModal';
import PrintInvoiceModal from '../../components/PrintInvoiceModal/PrintInvoiceModal';
import { 
  CreditCard, Printer, Eye, RotateCw, CheckCircle2, 
  Clock, Truck, CheckCheck, XCircle, AlertCircle 
} from 'lucide-react';
import './OrderHistory.css';

export default function OrderHistory() {
  const { user, token } = useContext(AuthContext);
  const [searchParams, setSearchParams] = useSearchParams();

  const [orders, setOrders] = useState([]);
  const [productsMap, setProductsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modals state
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [payOrder, setPayOrder] = useState(null);
  const [printOrder, setPrintOrder] = useState(null);

  // Success alert message
  const [successBanner, setSuccessBanner] = useState('');

  // Fetch orders from API
  const loadOrders = useCallback(async (isSilent = false) => {
    if (!token) return;
    if (!isSilent) setRefreshing(true);

    try {
      const res = await fetch('/api/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setOrders(data);
        // If an order modal is open, sync its state
        if (selectedOrder) {
          const fresh = data.find(o => o.orderId === selectedOrder.orderId);
          if (fresh) setSelectedOrder(fresh);
        }
      }
    } catch (err) {
      console.error("Failed to load orders", err);
    } finally {
      if (!isSilent) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [token, selectedOrder]);

  // Initial load
  useEffect(() => {
    if (!token) return;

    const init = async () => {
      try {
        const [ordersRes, allProducts] = await Promise.all([
          fetch('/api/orders', {
            headers: { 'Authorization': `Bearer ${token}` }
          }).then(res => res.json()),
          fetchProducts()
        ]);

        const pMap = {};
        allProducts.forEach(p => pMap[p.id] = p);
        setProductsMap(pMap);

        if (Array.isArray(ordersRes)) {
          setOrders(ordersRes);
        }
      } catch (err) {
        console.error("Initial load failed", err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [token]);

  // Handle Stripe redirect query parameters: ?paid=true&order_id=...&session_id=...
  useEffect(() => {
    const isPaidParam = searchParams.get('paid');
    const orderIdParam = searchParams.get('order_id');
    const sessionIdParam = searchParams.get('session_id');

    if (isPaidParam === 'true' && orderIdParam && token) {
      const verifyStripePayment = async () => {
        try {
          const res = await fetch(`/api/orders/${orderIdParam}/verify-payment`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ sessionId: sessionIdParam || 'stripe_return' })
          });

          const data = await res.json();
          if (res.ok && data.success) {
            setSuccessBanner(`Payment confirmed! Order #${orderIdParam} has been successfully settled and marked as PAID.`);
            loadOrders(true);
          }
        } catch (err) {
          console.error("Stripe verification error:", err);
        } finally {
          // Clear query params from URL cleanly without reloading
          setSearchParams({}, { replace: true });
        }
      };

      verifyStripePayment();
    }
  }, [searchParams, token, loadOrders, setSearchParams]);

  // Auto-refresh polling every 10 seconds to reflect status changes made by admin
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => {
      loadOrders(true);
    }, 10000);
    return () => clearInterval(interval);
  }, [token, loadOrders]);

  // When payment is completed from ClientPaymentModal
  const handlePaymentCompleted = (updatedOrder) => {
    setOrders(prev => prev.map(o => o.orderId === updatedOrder.orderId ? updatedOrder : o));
    if (selectedOrder && selectedOrder.orderId === updatedOrder.orderId) {
      setSelectedOrder(updatedOrder);
    }
    setPayOrder(null);
    setSuccessBanner(`Payment confirmed! Order #${updatedOrder.orderId} is now marked as PAID.`);
  };

  // Status badge renderer
  const renderStatusBadge = (order) => {
    const status = order.orderStatus || 'pending_invoice';

    switch (status) {
      case 'invoice_issued':
        return (
          <span className="status-badge invoice_issued" title="Delivery charge added, tax invoice ready to pay">
            <CreditCard size={12} />
            <span>Tax Invoice Ready</span>
          </span>
        );
      case 'paid':
        return (
          <span className="status-badge paid" title="Payment settled">
            <CheckCircle2 size={12} />
            <span>Paid</span>
          </span>
        );
      case 'dispatched':
        return (
          <span className="status-badge dispatched" title="Dispatched with courier">
            <Truck size={12} />
            <span>Dispatched</span>
          </span>
        );
      case 'delivered':
        return (
          <span className="status-badge delivered" title="Delivered to destination store">
            <CheckCheck size={12} />
            <span>Delivered</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="status-badge cancelled" title="Order cancelled">
            <XCircle size={12} />
            <span>Cancelled</span>
          </span>
        );
      default:
        return (
          <span className="status-badge pending_invoice" title="Waiting for dispatch team to add delivery charge">
            <Clock size={12} />
            <span>Invoice Requested</span>
          </span>
        );
    }
  };

  if (!user && !token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <main className="orders-page">
      <div className="container orders-container">
        {/* Header with Title & Refresh button */}
        <div className="orders-header-row">
          <div>
            <h1 className="orders-title">Your Order History & Invoices</h1>
            <p style={{ color: 'var(--ink-soft)', fontSize: '0.9rem', margin: '4px 0 0' }}>
              Track order statuses, review consolidated delivery charges, and settle tax invoices online.
            </p>
          </div>
          <button 
            type="button" 
            className="orders-refresh-btn" 
            onClick={() => loadOrders(false)}
            disabled={refreshing}
            title="Refresh order statuses"
          >
            <RotateCw size={15} className={refreshing ? 'spin' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Status'}</span>
          </button>
        </div>

        {/* Success Banner */}
        {successBanner && (
          <div className="orders-success-banner">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle2 size={18} />
              <span>{successBanner}</span>
            </div>
            <button 
              type="button" 
              className="close-banner" 
              onClick={() => setSuccessBanner('')}
            >
              ×
            </button>
          </div>
        )}

        {loading ? (
          <p style={{ color: 'var(--ink-soft)' }}>Loading your orders and invoices...</p>
        ) : orders.length === 0 ? (
          <div className="no-orders">
            <h3>No orders placed yet</h3>
            <p>You haven't requested any tax invoices or placed orders yet.</p>
            <Button as={Link} to="/products" variant="primary">
              Browse Diagnostic Catalog
            </Button>
          </div>
        ) : (
          <div className="orders-table-wrapper">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order Ref & Invoice</th>
                  <th>Receiving Store</th>
                  <th>Order Date</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => {
                  const status = order.orderStatus || 'pending_invoice';
                  const subtotal = order.subtotalExGst != null 
                    ? order.subtotalExGst 
                    : (order.totalAmount / 100);
                  const isIssued = status === 'invoice_issued';
                  const isPaid = status === 'paid' || order.paymentStatus === 'paid';
                  const hasDelivery = order.deliveryCharge !== undefined && order.deliveryCharge > 0;
                  const finalTotal = order.finalInvoiceTotal || (subtotal * 1.1);

                  return (
                    <tr key={order._id || order.orderId}>
                      {/* Ref & Invoice # */}
                      <td className="ot-id">
                        <div>{order.orderId || `ORD-${order._id.slice(-8).toUpperCase()}`}</div>
                        {order.invoiceNumber && (
                          <div style={{ fontSize: '0.75rem', color: '#38bdf8', marginTop: '2px', fontFamily: 'monospace' }}>
                            {order.invoiceNumber}
                          </div>
                        )}
                        {order.poNumber && (
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                            PO: {order.poNumber}
                          </div>
                        )}
                      </td>

                      {/* Store */}
                      <td>
                        <strong style={{ color: '#ffffff' }}>{order.store?.name || 'Main Location'}</strong>
                        {order.store?.address && (
                          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>
                            {order.store.address}
                          </div>
                        )}
                      </td>

                      {/* Date */}
                      <td className="ot-date">
                        {new Date(order.createdAt).toLocaleDateString('en-AU', {
                          day: '2-digit', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </td>

                      {/* Financial Amount */}
                      <td className="ot-total">
                        {status === 'pending_invoice' ? (
                          <>
                            <div>${subtotal.toFixed(2)} AUD</div>
                            <div style={{ fontSize: '0.74rem', color: '#fbbf24', marginTop: '2px' }}>
                              + Courier Fee (Calculating)
                            </div>
                          </>
                        ) : (
                          <>
                            <div style={{ color: isPaid ? '#4ade80' : '#ffffff', fontSize: '15px' }}>
                              ${finalTotal.toFixed(2)} AUD
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#38bdf8', marginTop: '2px' }}>
                              Inc. Delivery (${(order.deliveryCharge || 0).toFixed(2)}) & GST
                            </div>
                          </>
                        )}
                      </td>

                      {/* Status */}
                      <td>
                        {renderStatusBadge(order)}
                      </td>

                      {/* Actions */}
                      <td>
                        <div className="ot-actions-cell">
                          {/* Prominent PAY NOW button when invoice is issued */}
                          {isIssued && (
                            <button 
                              type="button" 
                              className="ot-pay-now-btn"
                              onClick={() => setPayOrder(order)}
                              title="Pay Tax Invoice Online"
                            >
                              <CreditCard size={14} />
                              <span>Pay Now</span>
                            </button>
                          )}

                          {/* View Details Modal */}
                          <button 
                            type="button" 
                            className="ot-action-btn" 
                            onClick={() => setSelectedOrder(order)}
                          >
                            View Details
                          </button>

                          {/* Print Tax Invoice button if invoice has been issued */}
                          {status !== 'pending_invoice' && (
                            <button 
                              type="button" 
                              className="ot-print-btn" 
                              onClick={() => setPrintOrder(order)}
                              title="Print Official Tax Invoice"
                            >
                              <Printer size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* 1. Order Details Modal */}
      {selectedOrder && (
        <OrderDetailsModal 
          isOpen={!!selectedOrder} 
          order={selectedOrder} 
          productsMap={productsMap} 
          token={token}
          onClose={() => setSelectedOrder(null)} 
          onOpenPayModal={(ord) => {
            setSelectedOrder(null);
            setPayOrder(ord);
          }}
          onOpenPrintModal={(ord) => {
            setPrintOrder(ord);
          }}
        />
      )}

      {/* 2. Client Payment Modal (Stripe Card & Direct Bank EFT) */}
      {payOrder && (
        <ClientPaymentModal
          order={payOrder}
          token={token}
          onClose={() => setPayOrder(null)}
          onPaymentSuccess={handlePaymentCompleted}
        />
      )}

      {/* 3. Official Printable Tax Invoice Modal */}
      {printOrder && (
        <PrintInvoiceModal
          order={printOrder}
          onClose={() => setPrintOrder(null)}
        />
      )}
    </main>
  );
}
