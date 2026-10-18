import React from 'react';
import { Printer, X, Download, Building2, CheckCircle2 } from 'lucide-react';
import './PrintInvoiceModal.css';

export default function PrintInvoiceModal({ order, onClose }) {
  if (!order) return null;

  const invoiceNum = order.invoiceNumber || `INV-${order.orderId}`;
  const subtotal = order.subtotalExGst || (order.totalAmount ? order.totalAmount / 100 : 0);
  const delivery = order.deliveryCharge || 0;
  const taxable = subtotal + delivery;
  const gst = order.gstAmount || parseFloat((taxable * 0.10).toFixed(2));
  const total = order.finalInvoiceTotal || parseFloat((taxable + gst).toFixed(2));
  const isPaid = order.orderStatus === 'paid' || order.paymentStatus === 'paid';

  const formattedDate = order.invoiceIssuedAt 
    ? new Date(order.invoiceIssuedAt).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })
    : new Date(order.createdAt || Date.now()).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });

  // 100% Reliable Print function using dedicated isolated hidden iframe
  // Eliminates white/blank page bugs caused by React SPA containers
  const handlePrint = () => {
    const printContent = document.getElementById('printableInvoice');
    if (!printContent) {
      window.print();
      return;
    }

    // Clean up any existing print frame
    const existingFrame = document.getElementById('vds-invoice-print-frame');
    if (existingFrame) existingFrame.remove();

    const iframe = document.createElement('iframe');
    iframe.id = 'vds-invoice-print-frame';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Official Tax Invoice - ${invoiceNum} - Victoria Diagnostic Supplies</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 12mm 15mm;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              color: #0f172a;
              background: #ffffff;
              line-height: 1.5;
              font-size: 12px;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .printable-tax-invoice {
              width: 100%;
              max-width: 100%;
              background: #ffffff;
              padding: 10px;
            }
            .invoice-doc-header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 3px solid #0f172a;
              padding-bottom: 16px;
              margin-bottom: 20px;
            }
            .brand-logo-title h2 {
              font-size: 20px;
              font-weight: 900;
              color: #0f172a;
              margin: 0;
              letter-spacing: -0.02em;
            }
            .brand-logo-title .pty-ltd {
              font-size: 11px;
              font-weight: 800;
              color: #64748b;
              letter-spacing: 0.08em;
            }
            .brand-details {
              font-size: 11px;
              color: #475569;
              margin-top: 6px;
              line-height: 1.4;
            }
            .brand-details p { margin: 2px 0; }
            .tax-invoice-title {
              font-size: 24px;
              font-weight: 900;
              color: #0284c7;
              letter-spacing: -0.02em;
              margin: 0 0 8px 0;
              text-align: right;
            }
            .meta-table {
              border-collapse: collapse;
              font-size: 11px;
              margin-left: auto;
            }
            .meta-table th {
              text-align: right;
              padding: 2px 8px;
              color: #64748b;
              font-weight: 600;
            }
            .meta-table td {
              text-align: right;
              padding: 2px 0;
              color: #0f172a;
              font-weight: 600;
            }
            .meta-table .highlight-inv {
              color: #0284c7;
              font-weight: 800;
              font-size: 12px;
            }
            .meta-table .highlight-po {
              color: #0f172a;
              font-weight: 700;
            }
            .invoice-addresses-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 16px;
              margin-bottom: 22px;
            }
            .address-card {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              padding: 12px;
            }
            .address-card .card-heading {
              font-size: 10px;
              font-weight: 800;
              color: #64748b;
              letter-spacing: 0.06em;
              margin-bottom: 6px;
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 4px;
            }
            .address-card .card-body p {
              margin: 2px 0;
              font-size: 11px;
              color: #334155;
            }
            .address-card .card-body .primary-name {
              font-size: 13px;
              font-weight: 700;
              color: #0f172a;
            }
            .address-card .card-body .street-addr {
              font-weight: 500;
            }
            .address-card .card-body .instructions {
              margin-top: 4px;
              color: #0284c7;
              font-style: italic;
            }
            .invoice-items-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            .invoice-items-table th {
              background: #f1f5f9;
              color: #334155;
              font-size: 11px;
              font-weight: 700;
              padding: 8px 10px;
              border-top: 1px solid #cbd5e1;
              border-bottom: 1px solid #cbd5e1;
              text-align: left;
            }
            .invoice-items-table td {
              padding: 8px 10px;
              border-bottom: 1px solid #e2e8f0;
              font-size: 11px;
              color: #1e293b;
            }
            .invoice-items-table .th-num, .invoice-items-table .td-num { width: 30px; text-align: center; }
            .invoice-items-table .th-qty, .invoice-items-table .td-qty { width: 50px; text-align: center; }
            .invoice-items-table .th-price, .invoice-items-table .td-price { width: 110px; text-align: right; }
            .invoice-items-table .th-subtotal, .invoice-items-table .td-subtotal { width: 110px; text-align: right; font-weight: 600; }
            .invoice-items-table .th-sku, .invoice-items-table .td-sku { width: 90px; color: #64748b; font-family: monospace; }
            .freight-row td {
              background: #f8fafc;
              font-weight: 600;
            }
            .freight-sub {
              font-size: 9px;
              color: #64748b;
              font-weight: normal;
            }
            .invoice-summary-section {
              display: grid;
              grid-template-columns: 1.2fr 1fr;
              gap: 20px;
              margin-bottom: 22px;
            }
            .payment-instructions-box {
              background: #f0f9ff;
              border: 1px solid #bae6fd;
              border-radius: 6px;
              padding: 12px;
            }
            .payment-instructions-box h4 {
              margin: 0 0 6px 0;
              font-size: 11px;
              font-weight: 800;
              color: #0369a1;
              letter-spacing: 0.05em;
            }
            .eft-grid {
              font-size: 11px;
              line-height: 1.6;
              color: #0f172a;
            }
            .eft-ref span {
              font-family: monospace;
              font-weight: 800;
              color: #0284c7;
            }
            .remittance-note {
              font-size: 10px;
              color: #475569;
              margin: 6px 0 0 0;
            }
            .financials-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 11px;
            }
            .financials-table td {
              padding: 3px 0;
              color: #475569;
            }
            .financials-table td:last-child {
              text-align: right;
              font-weight: 600;
              color: #0f172a;
            }
            .financials-table .taxable-row td {
              border-top: 1px dashed #cbd5e1;
              padding-top: 5px;
              font-weight: 600;
            }
            .financials-table .grand-total-row th {
              border-top: 2px solid #0f172a;
              padding: 8px 0;
              font-size: 13px;
              font-weight: 900;
              color: #0284c7;
              text-align: left;
            }
            .financials-table .grand-total-row th:last-child {
              text-align: right;
            }
            .invoice-doc-footer {
              border-top: 1px solid #e2e8f0;
              padding-top: 14px;
              font-size: 10px;
              color: #64748b;
              text-align: center;
            }
            .invoice-doc-footer p { margin: 2px 0; }
          </style>
        </head>
        <body>
          <div class="printable-tax-invoice">
            ${printContent.innerHTML}
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => {
        iframe.remove();
      }, 2000);
    }, 250);
  };

  return (
    <div className="print-invoice-overlay">
      <div className="print-modal-container">
        {/* Modal Toolbar (hidden during print) */}
        <div className="print-modal-toolbar no-print">
          <div className="toolbar-left">
            <span className="toolbar-title">Official Tax Invoice Preview</span>
            <span className="toolbar-badge">{invoiceNum}</span>
          </div>
          <div className="toolbar-right">
            <button type="button" className="print-action-btn primary" onClick={handlePrint}>
              <Printer size={16} />
              <span>Print / Save PDF</span>
            </button>
            <button type="button" className="print-action-btn close" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Tax Invoice Document (A4 format) */}
        <div className="printable-tax-invoice" id="printableInvoice">
          {/* Document Header */}
          <div className="invoice-doc-header">
            <div className="doc-brand">
              <div className="brand-logo-title">
                <h2>VICTORIA DIAGNOSTIC SUPPLIES</h2>
                <span className="pty-ltd">PTY LTD</span>
              </div>
              <div className="brand-details">
                <p><strong>ABN:</strong> 84 123 456 789</p>
                <p>Building 4, 120-130 St Kilda Rd, Melbourne VIC 3004</p>
                <p>Orders: (03) 9000 0000 · dispatch@vdsupplies.com.au</p>
              </div>
            </div>

            <div className="doc-invoice-meta">
              <h1 className="tax-invoice-title">TAX INVOICE</h1>
              <table className="meta-table">
                <tbody>
                  <tr>
                    <th>Invoice No:</th>
                    <td className="highlight-inv">{invoiceNum}</td>
                  </tr>
                  <tr>
                    <th>Order Reference:</th>
                    <td>{order.orderId}</td>
                  </tr>
                  <tr>
                    <th>Date:</th>
                    <td>{formattedDate}</td>
                  </tr>
                  <tr>
                    <th>Payment Status:</th>
                    <td style={{ color: isPaid ? '#16a34a' : '#d97706', fontWeight: 800 }}>
                      {isPaid ? 'PAID / SETTLED' : 'PAYMENT DUE'}
                    </td>
                  </tr>
                  {order.poNumber && (
                    <tr>
                      <th>Purchase Order (PO):</th>
                      <td className="highlight-po">{order.poNumber}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bill To & Deliver To */}
          <div className="invoice-addresses-grid">
            <div className="address-card">
              <div className="card-heading">BILL TO (TRADE CLIENT)</div>
              <div className="card-body">
                <p className="primary-name">{order.companyName || order.customerName || 'Trade Client'}</p>
                {order.companyAbn && <p><strong>ABN:</strong> {order.companyAbn}</p>}
                <p><strong>Attention:</strong> {order.customerName}</p>
                <p><strong>Email:</strong> {order.customerEmail}</p>
                {order.customerPhone && <p><strong>Phone:</strong> {order.customerPhone}</p>}
              </div>
            </div>

            <div className="address-card">
              <div className="card-heading">DELIVER TO (PRACTICE LOCATION)</div>
              <div className="card-body">
                <p className="primary-name">{order.store?.name || 'Main Receiving Location'}</p>
                <p className="street-addr">{order.store?.address || 'Delivery Address on file'}</p>
                {order.store?.contactNumber && (
                  <p><strong>Site Contact:</strong> {order.store.contactNumber}</p>
                )}
                {order.specialInstructions && (
                  <p className="instructions"><strong>Special Instructions:</strong> {order.specialInstructions}</p>
                )}
              </div>
            </div>
          </div>

          {/* Itemized Table */}
          <table className="invoice-items-table">
            <thead>
              <tr>
                <th className="th-num">#</th>
                <th>Item Description</th>
                <th className="th-sku">SKU</th>
                <th className="th-qty">Qty</th>
                <th className="th-price">Unit Price (Ex GST)</th>
                <th className="th-subtotal">Total (Ex GST)</th>
              </tr>
            </thead>
            <tbody>
              {(order.items || []).map((item, idx) => (
                <tr key={idx}>
                  <td className="td-num">{idx + 1}</td>
                  <td>
                    <strong>{item.name}</strong>
                  </td>
                  <td className="td-sku">{item.sku || 'N/A'}</td>
                  <td className="td-qty">{item.quantity}</td>
                  <td className="td-price">${(item.price || 0).toFixed(2)}</td>
                  <td className="td-subtotal">${((item.price || 0) * item.quantity).toFixed(2)}</td>
                </tr>
              ))}

              {/* Delivery Charge as a single line item */}
              <tr className="freight-row">
                <td className="td-num">{(order.items?.length || 0) + 1}</td>
                <td colSpan="4">
                  <strong>Consolidated Delivery & Express Courier Handling</strong>
                  <div className="freight-sub">Direct delivery fee to {order.store?.name || 'destination store'}</div>
                </td>
                <td className="td-subtotal">${delivery.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          {/* Summary & Bank Payment Details */}
          <div className="invoice-summary-section">
            <div className="payment-instructions-box">
              <h4>ELECTRONIC FUNDS TRANSFER (EFT) DETAILS</h4>
              <div className="eft-grid">
                <div><strong>Bank:</strong> National Australia Bank (NAB)</div>
                <div><strong>Account Name:</strong> Victoria Diagnostic Supplies Pty Ltd</div>
                <div><strong>BSB:</strong> 083-004</div>
                <div><strong>Account Number:</strong> 8492 1045</div>
                <div className="eft-ref"><strong>Payment Reference:</strong> <span>{invoiceNum}</span></div>
              </div>
              <p className="remittance-note">
                Please quote reference <strong>{invoiceNum}</strong> on transfer. Remittance advice to: <strong>accounts@vdsupplies.com.au</strong>
              </p>
            </div>

            <div className="financials-breakdown">
              <table className="financials-table">
                <tbody>
                  <tr>
                    <td>Items Subtotal (Ex GST):</td>
                    <td>${subtotal.toFixed(2)} AUD</td>
                  </tr>
                  <tr>
                    <td>Consolidated Delivery (Ex GST):</td>
                    <td>${delivery.toFixed(2)} AUD</td>
                  </tr>
                  <tr className="taxable-row">
                    <td>Net Taxable Subtotal:</td>
                    <td>${taxable.toFixed(2)} AUD</td>
                  </tr>
                  <tr>
                    <td>Goods & Services Tax (10% GST):</td>
                    <td>${gst.toFixed(2)} AUD</td>
                  </tr>
                  <tr className="grand-total-row">
                    <th>TOTAL AMOUNT DUE:</th>
                    <th>${total.toFixed(2)} AUD</th>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Document Footer */}
          <div className="invoice-doc-footer">
            <p>Victoria Diagnostic Supplies Pty Ltd · ABN 84 123 456 789 · Registered for GST</p>
            <p>Thank you for partnering with VDS. Prompt payment within payment terms is appreciated.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
