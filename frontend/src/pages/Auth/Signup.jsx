import { useState, useContext, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { 
  Building2, 
  Store, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  User as UserIcon, 
  MapPin, 
  Phone 
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import Button from '../../components/Button/Button';
import './Auth.css';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyAbn, setCompanyAbn] = useState('');
  
  // Store management state: array of stores
  const [stores, setStores] = useState([
    { id: '1', name: '', address: '', contactNumber: '' }
  ]);

  // Google OAuth pending state if company details are needed
  const [googleProfile, setGoogleProfile] = useState(null);

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const companyInputRef = useRef(null);

  useEffect(() => {
    if (window.location.hostname === '127.0.0.1') {
      window.location.hostname = 'localhost';
    }
  }, []);

  const handleAddStore = () => {
    setStores(prev => [
      ...prev,
      { id: String(Date.now()), name: '', address: '', contactNumber: '' }
    ]);
  };

  const handleRemoveStore = (index) => {
    if (stores.length > 1) {
      setStores(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleStoreChange = (index, field, value) => {
    setStores(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  // Helper to validate store fields
  const validateForm = () => {
    if (!companyName.trim()) {
      setError('Company Name is required.');
      return false;
    }
    // Check if at least one store has details
    const validStore = stores.some(s => s.name.trim() || s.address.trim() || s.contactNumber.trim());
    if (!validStore) {
      setError('Please add at least one store with a store name and address.');
      return false;
    }
    return true;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    setLoading(true);

    try {
      if (googleProfile) {
        // Complete registration via Google credentials + company & stores
        const res = await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            credential: googleProfile.credential,
            companyName: companyName.trim(),
            companyAbn: companyAbn.trim(),
            stores
          })
        });
        const data = await res.json();

        if (res.ok) {
          login(data.user, data.token);
          const from = location.state?.from?.pathname || '/profile';
          navigate(from, { replace: true });
        } else {
          setError(data.error || 'Google Registration failed');
        }
      } else {
        // Standard email/password registration
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            password,
            companyName: companyName.trim(),
            companyAbn: companyAbn.trim(),
            stores
          })
        });
        const data = await res.json();

        if (res.ok) {
          login(data.user, data.token);
          const from = location.state?.from?.pathname || '/profile';
          navigate(from, { replace: true });
        } else {
          setError(data.error || 'Registration failed');
        }
      }
    } catch (err) {
      setError('Service unavailable. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setError(null);
      const token = credentialResponse.credential;
      
      // Parse token payload safely
      let parsedPayload = null;
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        parsedPayload = JSON.parse(jsonPayload);
      } catch (e) {
        console.warn('Could not parse Google token locally', e);
      }

      // Check if user already filled in company details before clicking Google button
      const hasCompanyDetails = companyName.trim() && stores.some(s => s.name.trim());

      if (hasCompanyDetails) {
        setLoading(true);
        const res = await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            credential: token,
            companyName: companyName.trim(),
            companyAbn: companyAbn.trim(),
            stores
          })
        });
        const data = await res.json();
        setLoading(false);

        if (res.ok) {
          login(data.user, data.token);
          const from = location.state?.from?.pathname || '/profile';
          navigate(from, { replace: true });
          return;
        } else {
          setError(data.error || 'Google Registration failed');
          return;
        }
      }

      // If company details not filled yet: prompt user to complete them!
      const gName = parsedPayload?.name || '';
      const gEmail = parsedPayload?.email || '';

      // Test with checkOnly to see if existing user
      setLoading(true);
      const checkRes = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: token, checkOnly: true })
      });
      const checkData = await checkRes.json();
      setLoading(false);

      if (checkRes.ok && checkData.token) {
        // User already has an account, log them right in
        login(checkData.user, checkData.token);
        const from = location.state?.from?.pathname || '/';
        navigate(from, { replace: true });
        return;
      }

      // New user needing company & store details
      setGoogleProfile({
        credential: token,
        name: gName,
        email: gEmail,
      });
      if (gName) setName(gName);
      if (gEmail) setEmail(gEmail);

      // Focus to company input
      setTimeout(() => {
        if (companyInputRef.current) {
          companyInputRef.current.focus();
        }
      }, 100);

    } catch (err) {
      setError('Google Sign-In failed. Please try again.');
    }
  };

  const handleGoogleError = () => {
    if (window.location.hostname === '127.0.0.1') {
      setError('Google Sign-In does not support IP addresses (127.0.0.1). Redirecting to localhost...');
      window.location.hostname = 'localhost';
    } else {
      setError('Google Registration failed: The current origin (' + window.location.origin + ') may not be listed in Authorized JavaScript Origins in Google Cloud Console.');
    }
  };

  const resetGoogleProfile = () => {
    setGoogleProfile(null);
    setName('');
    setEmail('');
  };

  return (
    <main className="auth-page">
      <div className="auth-container auth-container--wide">
        <h1 className="auth-title">
          {googleProfile ? 'Complete Registration' : 'Create Trade Account'}
        </h1>
        <p className="auth-subtitle">
          {googleProfile 
            ? 'Complete your company and store details to finish setting up your account'
            : 'Join Victoria Diagnostic Supplies to access clinical pricing, orders, and branch management'}
        </p>

        {error && (
          <div className="auth-error" role="alert">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {googleProfile && (
          <div className="auth-google-banner">
            <div className="auth-google-banner__info">
              <CheckCircle2 size={22} color="#4ade80" />
              <div className="auth-google-banner__details">
                <strong>Google Account Verified</strong>
                <span>{googleProfile.name} ({googleProfile.email})</span>
              </div>
            </div>
            <button 
              type="button" 
              className="auth-google-banner__reset"
              onClick={resetGoogleProfile}
            >
              Use another method
            </button>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSignup}>
          {/* SECTION 1: Personal Credentials (Hidden or simplified if Google verified) */}
          {!googleProfile ? (
            <div className="auth-section">
              <div className="auth-section__header">
                <span className="auth-section__title">
                  <UserIcon size={16} /> Account Contact
                </span>
              </div>
              <div className="auth-grid-2">
                <div className="auth-input-group">
                  <label htmlFor="name">Full Name <span className="req">*</span></label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Dr. Sarah Jenkins"
                    required
                  />
                </div>
                <div className="auth-input-group">
                  <label htmlFor="email">Work Email <span className="req">*</span></label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="s.jenkins@clinic.com.au"
                    required
                  />
                </div>
              </div>
              <div className="auth-input-group">
                <label htmlFor="password">Password <span className="req">*</span></label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  required
                  minLength="6"
                />
              </div>
            </div>
          ) : null}

          {/* SECTION 2: Company Information */}
          <div className="auth-section">
            <div className="auth-section__header">
              <span className="auth-section__title">
                <Building2 size={16} /> Company Details
              </span>
            </div>
            <div className="auth-grid-2">
              <div className="auth-input-group">
                <label htmlFor="companyName">Company Name <span className="req">*</span></label>
                <input
                  type="text"
                  id="companyName"
                  ref={companyInputRef}
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Metro Radiology Group Pty Ltd"
                  required
                />
              </div>
              <div className="auth-input-group">
                <label htmlFor="companyAbn">Company ABN Number</label>
                <input
                  type="text"
                  id="companyAbn"
                  value={companyAbn}
                  onChange={(e) => setCompanyAbn(e.target.value)}
                  placeholder="11-digit ABN (e.g. 51 824 753 556)"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: Stores / Branch Locations */}
          <div className="auth-section">
            <div className="auth-section__header">
              <span className="auth-section__title">
                <Store size={16} /> Stores & Branches ({stores.length})
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--ink-soft)' }}>
                Multiple stores allowed per company
              </span>
            </div>

            <div className="auth-stores-list">
              {stores.map((store, index) => (
                <div key={store.id || index} className="auth-store-card">
                  <div className="auth-store-card__header">
                    <span className="auth-store-card__tag">
                      <Store size={14} /> Store #{index + 1}
                    </span>
                    {stores.length > 1 && (
                      <button
                        type="button"
                        className="auth-store-card__remove"
                        onClick={() => handleRemoveStore(index)}
                        title="Remove this store"
                      >
                        <Trash2 size={14} />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>

                  <div className="auth-grid-2" style={{ marginBottom: '0.75rem' }}>
                    <div className="auth-input-group">
                      <label htmlFor={`store-name-${index}`}>Store Name <span className="req">*</span></label>
                      <input
                        type="text"
                        id={`store-name-${index}`}
                        value={store.name}
                        onChange={(e) => handleStoreChange(index, 'name', e.target.value)}
                        placeholder="e.g. Melbourne CBD Branch"
                        required
                      />
                    </div>
                    <div className="auth-input-group">
                      <label htmlFor={`store-phone-${index}`}>Store Contact Number</label>
                      <input
                        type="tel"
                        id={`store-phone-${index}`}
                        value={store.contactNumber}
                        onChange={(e) => handleStoreChange(index, 'contactNumber', e.target.value)}
                        placeholder="e.g. (03) 9123 4567"
                      />
                    </div>
                  </div>

                  <div className="auth-input-group">
                    <label htmlFor={`store-address-${index}`}>Store Address <span className="req">*</span></label>
                    <input
                      type="text"
                      id={`store-address-${index}`}
                      value={store.address}
                      onChange={(e) => handleStoreChange(index, 'address', e.target.value)}
                      placeholder="e.g. Level 4, 120 Collins Street, Melbourne VIC 3000"
                      required
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* + Add Another Store Button */}
            <button
              type="button"
              className="auth-btn-add-store"
              onClick={handleAddStore}
            >
              <Plus size={18} />
              <span>Add Another Store</span>
            </button>
          </div>

          <Button variant="primary" size="lg" fullWidth disabled={loading}>
            {loading 
              ? 'Setting up account...' 
              : googleProfile 
                ? 'Complete Registration' 
                : 'Create Account & Register Stores'}
          </Button>
        </form>

        {/* Google OAuth Section (if not already verified via Google) */}
        {!googleProfile && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', margin: '1.75rem 0 1.25rem' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--line)' }}></div>
              <span style={{ padding: '0 12px', color: 'var(--ink-soft)', fontSize: '0.85rem' }}>
                OR SIGN UP WITH GOOGLE
              </span>
              <div style={{ flex: 1, height: '1px', background: 'var(--line)' }}></div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                text="signup_with"
                theme="filled_blue"
                shape="rectangular"
              />
              <span style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', textAlign: 'center' }}>
                You can also fill company & store details first, or complete them with your Google account.
              </span>
            </div>
          </>
        )}

        <div className="auth-switch">
          Already have an account? <Link to="/login" state={location.state}>Sign in</Link>
        </div>
      </div>
    </main>
  );
}
