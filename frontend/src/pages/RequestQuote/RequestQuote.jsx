import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Send, Copy } from 'lucide-react';
import Button from '../../components/Button/Button';
import axios from 'axios';
import './RequestQuote.css';

export default function RequestQuote() {
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('product');
  const qtyParam = searchParams.get('qty') || '';
  const needParam = searchParams.get('need');
  
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  
  const [form, setForm] = useState({
    need: needParam || 'Request a quote',
    name: '',
    organization: '',
    email: '',
    phone: '',
    message: '',
    consent: false
  });
  const [file, setFile] = useState(null);

  useEffect(() => {
    document.title = "Talk to Us | VDS — Victoria Diagnostic Supplies";
    if (productId) {
      setForm(prev => ({
        ...prev,
        message: `Inquiry regarding product ID: ${productId}${qtyParam ? `, Quantity: ${qtyParam}` : ''}`
      }));
    }
    if (needParam) {
      setForm(prev => ({ ...prev, need: needParam }));
    }
  }, [productId, qtyParam, needParam]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleNeedSelect = (needOption) => {
    setForm({ ...form, need: needOption });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('info@vdsupplies.com.au');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.consent) {
      setError("Please agree to the privacy terms.");
      return;
    }
    
    setLoading(true);
    setError(null);

    const formData = new FormData();
    Object.keys(form).forEach(key => {
      formData.append(key, form[key]);
    });
    if (file) {
      formData.append('document', file);
    }

    try {
      await axios.post('/api/contact', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to send inquiry. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const needs = [
    { id: 'Request a quote', title: 'Request a quote', desc: 'Pricing for one or more products' },
    { id: 'Price check', title: 'Price check', desc: 'Compare against your current supplier' },
    { id: 'Product question', title: 'Product question', desc: 'Specs, compatibility, sourcing' },
    { id: 'Documents', title: 'Documents', desc: 'IFUs, datasheets, ARTG details' },
    { id: 'Existing order', title: 'Existing order', desc: 'Delivery or order query' },
    { id: 'Manufacturers', title: 'Manufacturers', desc: 'Supply a product through VDS' }
  ];

  return (
    <main className="contact-page">
      <div className="container contact-page__inner">
        
        {/* Header Section */}
        <div className="contact-page__header">
          <h1 className="contact-page__title">Talk to the people<br/>who import it.</h1>
          <p className="contact-page__subtitle">
            Tell us what you need and we'll route it to the right person. Most enquiries get a reply the same business day.
          </p>
        </div>

        <div className="contact-page__grid">
          {/* Left Column — Contact Info */}
          <div className="contact-page__info">
            
            <div className="contact-page__info-block">
              <span className="contact-page__info-label">PHONE</span>
              <p className="contact-page__info-value">0422 228 496</p>
            </div>
            
            <div className="contact-page__info-block">
              <span className="contact-page__info-label">EMAIL</span>
              <p className="contact-page__info-value">info@vdsupplies.com.au</p>
              <button className="contact-page__copy-btn" onClick={handleCopyEmail}>
                {copied ? 'Copied!' : 'Copy address'}
              </button>
            </div>

            <div className="contact-page__urgent-box">
              <h3>Urgent or after hours</h3>
              <p>Call rather than email, and tell us the product and delivery address.</p>
            </div>

          </div>

          {/* Right Column — Form */}
          <div className="contact-page__form-wrapper">
            {submitted ? (
              <div className="contact-page__success">
                <CheckCircle size={48} style={{ color: 'var(--cyan)' }} />
                <h2>Enquiry Sent</h2>
                <p>Thank you. We have received your request and will get back to you shortly.</p>
                <Button as={Link} to="/" variant="primary" size="md">
                  Back to Home
                </Button>
              </div>
            ) : (
              <form className="contact-page__form" onSubmit={handleSubmit}>
                <div className="contact-page__form-section">
                  <label className="contact-page__form-label">What do you need?</label>
                  <div className="contact-page__needs-grid">
                    {needs.map(n => (
                      <div 
                        key={n.id} 
                        className={`contact-page__need-card ${form.need === n.id ? 'active' : ''}`}
                        onClick={() => handleNeedSelect(n.id)}
                      >
                        <h4>{n.title}</h4>
                        <p>{n.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="contact-page__field-row">
                  <div className="contact-page__field">
                    <label>Your name</label>
                    <input type="text" name="name" required value={form.name} onChange={handleChange} />
                  </div>
                  <div className="contact-page__field">
                    <label>Practice or organisation</label>
                    <input type="text" name="organization" required value={form.organization} onChange={handleChange} />
                  </div>
                </div>

                <div className="contact-page__field-row">
                  <div className="contact-page__field">
                    <label>Work email</label>
                    <input type="email" name="email" required value={form.email} onChange={handleChange} />
                  </div>
                  <div className="contact-page__field">
                    <label>Phone (optional)</label>
                    <input type="tel" name="phone" value={form.phone} onChange={handleChange} />
                  </div>
                </div>

                <div className="contact-page__field">
                  <label>How can we help?</label>
                  <textarea 
                    name="message" 
                    rows="4" 
                    placeholder="Product names, quantities, the printer or probe model..."
                    value={form.message}
                    onChange={handleChange}
                    required
                  ></textarea>
                </div>

                <div className="contact-page__field">
                  <label>Attach an invoice or product list <span>(optional)</span></label>
                  <input type="file" onChange={handleFileChange} className="contact-page__file-input" />
                  <p className="contact-page__help-text">PDF, image or spreadsheet. Pricing you share stays confidential.</p>
                </div>

                <div className="contact-page__consent">
                  <input type="checkbox" id="consent" name="consent" checked={form.consent} onChange={handleChange} />
                  <label htmlFor="consent">
                    VDS can use these details to respond to this enquiry. We don't share them or add you to marketing lists.
                  </label>
                </div>
                
                {error && <p className="contact-page__error">{error}</p>}

                <Button type="submit" variant="primary" size="lg" iconRight={Send} disabled={loading}>
                  {loading ? 'Sending...' : 'Send enquiry'}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
