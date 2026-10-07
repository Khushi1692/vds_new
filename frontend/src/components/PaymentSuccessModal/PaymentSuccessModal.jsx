import { Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../Button/Button';
import './PaymentSuccessModal.css';

export default function PaymentSuccessModal({ isOpen, orderId, onClose }) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="psm-overlay">
      <div className="psm-content">
        <button className="psm-close" onClick={onClose}>
          <X size={20} color="var(--ink-soft)" />
        </button>
        
        <div className="psm-icon-wrapper">
          <div className="psm-icon-circle">
            <Check size={28} color="#22c55e" strokeWidth={3} />
          </div>
        </div>
        
        <h2 className="psm-title">Payment Successful!</h2>
        <p className="psm-subtitle">Thank you for your order.</p>
        
        <div className="psm-order-id">
          <strong>Order ID:</strong> {orderId}
        </div>
        
        <div className="psm-actions">
          <Button variant="primary" onClick={() => { onClose(); navigate('/products'); }} style={{ borderRadius: '24px' }}>
            Back to Menu
          </Button>
          <Button variant="outline" className="psm-outline-btn" onClick={() => { onClose(); navigate('/orders'); }} style={{ borderRadius: '24px' }}>
            View Orders
          </Button>
        </div>
      </div>
    </div>
  );
}
