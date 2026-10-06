import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  ShoppingCart,
  User as UserIcon,
  Package,
  LogOut,
  ChevronDown,
  FileText,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { useState, useContext, useEffect, useRef } from 'react';
import { CartContext } from '../../context/CartContext';
import { QuoteContext } from '../../context/QuoteContext';
import { AuthContext } from '../../context/AuthContext';
import logoImg from '../../assets/logo.webp';
import './Header.css';

const TICKER_TEXT = "More Than Medical Supplies. Complete Healthcare Solutions.";

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { cartCount } = useContext(CartContext);
  const { quoteCount } = useContext(QuoteContext);
  const { user, logout } = useContext(AuthContext);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menus on Esc key
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setDropdownOpen(false);
        setMobileOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = () => {
    setDropdownOpen(false);
    setMobileOpen(false);
    logout();
    navigate('/');
  };

  // Get user initial for avatar badge
  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : 'U');
  const userDisplayName = user?.name || user?.email?.split('@')[0] || 'Account';

  return (
    <header className="header">
      {/* Top Continuous Rotating Announcement Ticker Bar */}
      <div className="header__ticker" role="region" aria-label="Announcement">
        <div className="header__ticker-track">
          <div className="header__ticker-group">
            {[...Array(6)].map((_, i) => (
              <span key={`t1-${i}`} className="header__ticker-item">
                <span className="header__ticker-star">✦</span>
                <span>{TICKER_TEXT}</span>
              </span>
            ))}
          </div>
          <div className="header__ticker-group" aria-hidden="true">
            {[...Array(6)].map((_, i) => (
              <span key={`t2-${i}`} className="header__ticker-item">
                <span className="header__ticker-star">✦</span>
                <span>{TICKER_TEXT}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="header__inner">
        {/* Brand Logo */}
        <Link to="/" className="header__logo" aria-label="Victoria Diagnostic Supplies Home">
          <img src={logoImg} alt="Victoria Diagnostic Supplies" className="header__logo-img" />
          <div className="header__brand-text">
            <span className="header__brand-title">VICTORIA DIAGNOSTIC</span>
            <span className="header__brand-subtitle">SUPPLIES · AUSTRALIA</span>
          </div>
        </Link>

        {/* Primary Navigation */}
        <nav className={`header__nav ${mobileOpen ? 'header__nav--open' : ''}`}>
          <NavLink
            to="/"
            className={({ isActive }) => `header__link ${isActive ? 'header__link--active' : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            Home
          </NavLink>
          <NavLink
            to="/products"
            className={({ isActive }) => `header__link ${isActive ? 'header__link--active' : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            Range
          </NavLink>
          <NavLink
            to="/industries"
            className={({ isActive }) => `header__link ${isActive ? 'header__link--active' : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            Industries
          </NavLink>
          <NavLink
            to="/why-vds"
            className={({ isActive }) => `header__link ${isActive ? 'header__link--active' : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            Why VDS
          </NavLink>
          <NavLink
            to="/quality"
            className={({ isActive }) => `header__link ${isActive ? 'header__link--active' : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            Quality & ARTG
          </NavLink>
          <NavLink
            to="/procurement"
            className={({ isActive }) => `header__link ${isActive ? 'header__link--active' : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            Procurement
          </NavLink>
          <NavLink
            to="/about"
            className={({ isActive }) => `header__link ${isActive ? 'header__link--active' : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            About
          </NavLink>

          {/* Mobile-only CTA */}
          <div className="header__mobile-cta">
            {!user && (
              <Link
                to="/login"
                className="header__btn-signin-mobile"
                onClick={() => setMobileOpen(false)}
              >
                <UserIcon size={18} />
                <span>Sign In to Account</span>
              </Link>
            )}
            <Link
              to="/request-quote"
              className="header__btn-quote"
              onClick={() => setMobileOpen(false)}
            >
              <span>Talk to Us</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </nav>

        {/* Action Controls: Quote, Cart, Account */}
        <div className="header__actions">
          {/* Quote Pill with Live Counter Badge */}
          <Link
            to="/quote"
            className={`header__action-pill header__cart-pill ${quoteCount > 0 ? 'header__cart-pill--active' : ''}`}
            aria-label={`View quote list with ${quoteCount} items`}
            onClick={() => setMobileOpen(false)}
          >
            <div className="header__cart-icon-wrapper">
              <FileText size={19} className="header__action-icon" />
              {quoteCount > 0 && (
                <span className="header__cart-counter" aria-live="polite">
                  {quoteCount}
                </span>
              )}
            </div>
            <span className="header__action-text">Quote</span>
          </Link>

          {/* Cart Pill with Live Counter Badge */}
          <Link
            to="/cart"
            className={`header__action-pill header__cart-pill ${cartCount > 0 ? 'header__cart-pill--active' : ''}`}
            aria-label={`View cart with ${cartCount} items`}
            onClick={() => setMobileOpen(false)}
          >
            <div className="header__cart-icon-wrapper">
              <ShoppingCart size={19} className="header__action-icon" />
              {cartCount > 0 && (
                <span className="header__cart-counter" aria-live="polite">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="header__action-text">Cart</span>
          </Link>

          {/* User Account / Profile Dropdown */}
          {user ? (
            <div className="header__user-wrapper" ref={dropdownRef}>
              <button
                type="button"
                className={`header__user-btn ${dropdownOpen ? 'header__user-btn--open' : ''}`}
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
              >
                <div className="header__avatar">
                  {userInitial}
                </div>
                <span className="header__user-name">{userDisplayName}</span>
                <ChevronDown size={15} className={`header__chevron ${dropdownOpen ? 'header__chevron--rotated' : ''}`} />
              </button>

              {/* Glassmorphic Dropdown Menu */}
              {dropdownOpen && (
                <div className="header__dropdown" role="menu">
                  <div className="header__dropdown-header">
                    <span className="header__dropdown-greeting">Signed in as</span>
                    <strong className="header__dropdown-name">{user.name || 'Healthcare Practitioner'}</strong>
                    <span className="header__dropdown-email">{user.email}</span>
                  </div>

                  <div className="header__dropdown-divider" />

                  <Link
                    to="/orders"
                    className="header__dropdown-item"
                    role="menuitem"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <Package size={17} className="header__dropdown-icon" />
                    <span>My Order History</span>
                  </Link>

                  <Link
                    to="/request-quote"
                    className="header__dropdown-item"
                    role="menuitem"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <FileText size={17} className="header__dropdown-icon" />
                    <span>Talk to Us</span>
                  </Link>

                  <Link
                    to="/products"
                    className="header__dropdown-item"
                    role="menuitem"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <ShieldCheck size={17} className="header__dropdown-icon" />
                    <span>Browse Catalog</span>
                  </Link>

                  <div className="header__dropdown-divider" />

                  <button
                    type="button"
                    className="header__dropdown-item header__dropdown-item--logout"
                    role="menuitem"
                    onClick={handleLogout}
                  >
                    <LogOut size={17} className="header__dropdown-icon header__dropdown-icon--logout" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="header__action-pill header__signin-pill"
              onClick={() => setMobileOpen(false)}
            >
              <UserIcon size={18} className="header__action-icon" />
              <span className="header__action-text">Sign In</span>
            </Link>
          )}

          {/* Primary B2B Request Quote Button */}
          <Link
            to="/request-quote"
            className="header__btn-quote header__btn-quote--desktop"
          >
            <span>Talk to Us</span>
            <ArrowRight size={15} />
          </Link>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            className="header__mobile-toggle"
            aria-label="Toggle navigation menu"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
    </header>
  );
}
