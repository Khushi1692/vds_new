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
          <Link to="/" className="footer__logo" style={{ textDecoration: 'none' }}>
            <img src={logoImg} alt="Victoria Diagnostic Supplies" style={{ height: '40px', marginBottom: '1.2rem', filter: 'drop-shadow(0 4px 14px rgba(28, 77, 128, 0.5))' }} />
          </Link>
          <p className="footer__tagline" style={{ maxWidth: '320px', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            Victoria Diagnostic Supplies acknowledge the Traditional Owners of Country throughout Australia and recognise their continuing connection to land, waters and community. We pay our respect to them and their cultures and to Elders past and present.
          </p>
          <div className="footer__social" style={{ display: 'flex', gap: '0.8rem' }}>
            <a href="https://www.linkedin.com/company/victoria-diagnostic-supplies-pty-ltd/" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.7)' }}><LinkedinIcon style={{ width: 18, height: 18 }} /></a>
            <a href="https://www.instagram.com/victoriadiagnosticsupplies/" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.7)' }}><InstagramIcon style={{ width: 18, height: 18 }} /></a>
            <a href="https://wa.me/61422228496" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.7)' }}><WhatsappIcon style={{ width: 18, height: 18 }} /></a>
          </div>
        </div>

        <div className="footer__col">
          <h5 className="footer__col-title" style={{ color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.75rem', marginBottom: '1.2rem' }}>RANGE</h5>
          <ul className="footer__list">
            <li><Link to="/products?cat=Ultrasound%20%2F%20Imaging">Ultrasound / Imaging</Link></li>
            <li><Link to="/products?cat=Clinic%20Furniture">Clinic Furniture</Link></li>
            <li><Link to="/products?cat=Linen%20%26%20Gowns">Linen & Gowns</Link></li>
            <li><Link to="/products?cat=Paper%20%26%20Hygiene">Paper & Hygiene</Link></li>
          </ul>
        </div>

        <div className="footer__col">
          <h5 className="footer__col-title" style={{ color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.75rem', marginBottom: '1.2rem' }}>COMPANY</h5>
          <ul className="footer__list">
            <li><Link to="/about">About VDS</Link></li>
            <li><Link to="/why-vds">Why VDS</Link></li>
            <li><Link to="/quality">Quality & ARTG</Link></li>
            <li><Link to="/procurement">Smart procurement</Link></li>
            <li><Link to="/insights">Insights</Link></li>
          </ul>
        </div>

        <div className="footer__col">
          <h5 className="footer__col-title" style={{ color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.75rem', marginBottom: '1.2rem' }}>GET IN TOUCH</h5>
          <ul className="footer__list footer__list--contact">
            <li><Link to="/request-quote">Contact & quotes</Link></li>
            <li><Link to="/support">Ordering & delivery</Link></li>
            <li><Link to="/account">Trade account</Link></li>
            <li style={{ marginTop: '1rem', fontFamily: 'var(--font-family-mono)', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
              0422 228 496
            </li>
            <li style={{ fontFamily: 'var(--font-family-mono)', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
              info@vdsupplies.com.au
            </li>
            <li style={{ marginTop: '0.8rem', color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              PO Box
            </li>
          </ul>
        </div>
      </div>

      <div className="footer__bottom">
        <div className="container footer__bottom-inner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem', paddingBottom: '2rem' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>© 2026 Victoria Diagnostic Supplies Pty Ltd · Melbourne, Victoria · Australian owned</p>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <span style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '0.4rem 0.8rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-family-mono)', borderRadius: '4px' }}>
              Prototype build · forms don't send yet
            </span>
            <div className="footer__bottom-links" style={{ display: 'flex', gap: '1rem' }}>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
