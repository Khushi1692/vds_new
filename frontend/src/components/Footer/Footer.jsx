import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';
import logoImg from '../../assets/logo.webp';
import './Footer.css';

const LinkedinIcon = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={props.style}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const InstagramIcon = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={props.style}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const WhatsappIcon = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={props.style}
  >
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__main container">
        <div className="footer__brand">
          <Link to="/" className="footer__logo">
            <img src={logoImg} alt="Victoria Diagnostic Supplies" className="footer__logo-img" />
            <span className="footer__logo-text">Victoria Diagnostic Supplies</span>
          </Link>
          <p className="footer__tagline">
            Certified radiology consumables and equipment developed using state-of-the-art scientific innovation and advanced technology, held in Australian warehouses and dispatched same day.
          </p>
          <div className="footer__social">
            <a 
              href="https://www.linkedin.com/company/victoria-diagnostic-supplies-pty-ltd/" 
              className="footer__social-link" 
              target="_blank" 
              rel="noopener noreferrer" 
              aria-label="LinkedIn"
            >
              <LinkedinIcon style={{ width: 18, height: 18 }} />
            </a>
            <a 
              href="https://www.instagram.com/victoriadiagnosticsupplies/" 
              className="footer__social-link" 
              target="_blank" 
              rel="noopener noreferrer" 
              aria-label="Instagram"
            >
              <InstagramIcon style={{ width: 18, height: 18 }} />
            </a>
            <a 
              href="https://wa.me/61422228496" 
              className="footer__social-link" 
              target="_blank" 
              rel="noopener noreferrer" 
              aria-label="WhatsApp"
            >
              <WhatsappIcon style={{ width: 18, height: 18 }} />
            </a>
          </div>
        </div>

        <div className="footer__col">
          <h5 className="footer__col-title">Products</h5>
          <ul className="footer__list">
            <li><Link to="/products">All Products</Link></li>
            <li><Link to="/products?cat=contrast-injector">Contrast & Injectors</Link></li>
            <li><Link to="/products?cat=radiation-protection">Radiation Protection</Link></li>
            <li><Link to="/products?cat=patient-care">Patient Care & PPE</Link></li>
          </ul>
        </div>

        <div className="footer__col">
          <h5 className="footer__col-title">Company</h5>
          <ul className="footer__list">
            <li><Link to="/categories">Categories</Link></li>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/why-vds">Why VDS</Link></li>
            <li><Link to="/request-quote">Talk to Us</Link></li>
          </ul>
        </div>

        <div className="footer__col">
          <h5 className="footer__col-title">Connect</h5>
          <ul className="footer__list footer__list--contact">
            <li>
              <Mail size={14} />
              <a href="mailto:info@vdsupplies.com.au">info@vdsupplies.com.au</a>
            </li>
            <li>
              <Phone size={14} />
              <span>+61 422 228 496</span>
            </li>
            <li>
              <MapPin size={14} />
              <span>Australian Warehouses</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer__bottom">
        <div className="container footer__bottom-inner">
          <p>© 2026 Victoria Diagnostic Supplies Pty Ltd (VDS). All rights reserved. Clinical Precision & Sovereign Supply chains.</p>
          <div className="footer__bottom-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
