import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { INDS } from '../../data/industries';
import './TradeAccount.css';

export default function TradeAccount() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "Open a trade account | VDS";
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    // simulate api call
    setTimeout(() => {
      setLoading(false);
      navigate('/success?type=account');
    }, 1000);
  };

  return (
    <main className="trade-account-page">
      <div className="phead">
        <div className="container stack-lg">
          <div className="crumbs">
            <Link to="/">Home</Link>
            <span>/</span>
            <span>Trade account</span>
          </div>
          <h1>Open a trade account</h1>
          <p className="lede">
            Accounts get agreed pricing, invoice terms and a named contact. It takes about three minutes to apply.
          </p>
        </div>
      </div>

      <section className="band">
        <div className="container split">
          <div className="stack-lg" style={{ maxWidth: '400px' }}>
            <ul className="needs">
              <li>Pricing agreed once, used on every order</li>
              <li>Invoice terms once approved</li>
              <li>Standing reorder lists</li>
              <li>Documents for everything you buy, on request</li>
            </ul>
            <p className="muted" style={{ fontSize: '0.9rem', color: 'var(--ink-soft)' }}>
              We check ABNs against the Australian Business Register before approving an account.
            </p>
          </div>

          <div className="panel">
            <form className="form" onSubmit={handleSubmit}>
              <div className="row2">
                <div className="field">
                  <label htmlFor="a-org">Registered business name</label>
                  <input id="a-org" type="text" required autoComplete="organization" />
                </div>
                <div className="field">
                  <label htmlFor="a-abn">ABN</label>
                  <input id="a-abn" type="text" inputMode="numeric" required placeholder="11 digits" />
                </div>
              </div>
              <div className="row2">
                <div className="field">
                  <label htmlFor="a-type">Type of practice</label>
                  <select id="a-type" required defaultValue="">
                    <option value="" disabled>Choose one</option>
                    {INDS.map(i => <option key={i.id} value={i.name}>{i.name}</option>)}
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="a-spend">Expected monthly spend</label>
                  <select id="a-spend" defaultValue="Not sure yet">
                    <option value="Not sure yet">Not sure yet</option>
                    <option value="Under $1,000">Under $1,000</option>
                    <option value="$1,000 – $5,000">$1,000 – $5,000</option>
                    <option value="$5,000 – $20,000">$5,000 – $20,000</option>
                    <option value="Over $20,000">Over $20,000</option>
                  </select>
                </div>
              </div>
              <div className="row2">
                <div className="field">
                  <label htmlFor="a-name">Contact name</label>
                  <input id="a-name" type="text" required autoComplete="name" />
                </div>
                <div className="field">
                  <label htmlFor="a-email">Accounts email</label>
                  <input id="a-email" type="email" required autoComplete="email" placeholder="accounts@..." />
                </div>
              </div>
              <div className="field">
                <label htmlFor="a-addr">Delivery address</label>
                <input id="a-addr" type="text" required autoComplete="street-address" />
              </div>
              <div>
                <button className="btn primary" type="submit" disabled={loading}>
                  {loading ? 'Applying...' : 'Apply for an account'} <span className="arr">→</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
