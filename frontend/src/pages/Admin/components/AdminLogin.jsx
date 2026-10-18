import React, { useState } from 'react';
import { Lock, Mail, ShieldAlert, ArrowRight, Eye, EyeOff, Building2 } from 'lucide-react';

export default function AdminLogin({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both staff email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('http://localhost:3001/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      localStorage.setItem('vds_admin_token', data.token);
      localStorage.setItem('vds_admin_user', JSON.stringify(data.admin));
      onLoginSuccess(data.admin, data.token);
    } catch (err) {
      setError(err.message || 'Login failed. Please verify administrative credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickCredentials = () => {
    setEmail('admin@vds.com.au');
    setPassword('AdminVDS2026!Secure');
    setError('');
  };

  return (
    <div className="admin-login-wrapper">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <div className="admin-badge">
            <ShieldAlert size={14} />
            <span>SECURE INTERNAL ACCESS ONLY</span>
          </div>
          <div className="admin-brand-icon">
            <Building2 size={32} />
          </div>
          <h1>Victoria Diagnostic Supplies</h1>
          <p className="admin-subtitle">Enterprise Operations & Invoice Management Hub</p>
        </div>

        {error && (
          <div className="admin-error-box">
            <ShieldAlert size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="admin-input-group">
            <label htmlFor="adminEmail">Staff Email Address</label>
            <div className="admin-input-wrapper">
              <Mail size={18} className="input-icon" />
              <input
                id="adminEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. admin@vds.com.au"
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="admin-input-group">
            <label htmlFor="adminPassword">Security Passcode</label>
            <div className="admin-input-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                id="adminPassword"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="admin-login-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Enter Operations Console</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="admin-login-footer">
          <button
            type="button"
            className="admin-quick-fill-btn"
            onClick={fillQuickCredentials}
          >
            Fill Default Admin Credentials (admin@vds.com.au)
          </button>
          <div className="admin-security-notice">
            Melbourne Victoria HQ · Encrypted Session · Restricted Personnel Only
          </div>
        </div>
      </div>
    </div>
  );
}
