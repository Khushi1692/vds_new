import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronRight } from 'lucide-react';
import Button from '../../components/Button/Button';
import ProductCard from '../../components/ProductCard/ProductCard';
import { fetchFeaturedProducts, fetchProducts } from '../../data/products';
import './Home.css';
import disinfectorImg from '../../assets/disinfector.webp';
import imgRad from '../../assets/imaging_hospitals.jpg';
import imgHos from '../../assets/hospital_departments.jpg';
import imgGp from '../../assets/gp_allied_health.jpg';
import imgAh from '../../assets/physio_sports.jpg';
import imgAc from '../../assets/aged_care.jpg';
import { INDS } from '../../data/industries';

const ART = {
  gel: '<path d="M44 46h32v52a6 6 0 0 1-6 6H50a6 6 0 0 1-6-6z"/><path d="M48 46l3-8h18l3 8"/><path d="M55 38l2-12h6l2 12"/><circle class="accf" cx="60" cy="18" r="3.2"/><path class="dim" d="M32 46v58M29 46h6M29 104h6"/><path class="acc" d="M48 70h24"/>',
  apron: '<path d="M40 32q20 8 40 0l6 14-4 56q-22 6-44 0l-4-56z"/><path d="M48 32q12-14 24 0"/><path class="acc" d="M37 66h46"/><path class="dim" d="M94 46v56M91 46h6M91 102h6"/>',
  uvc: '<rect x="30" y="20" width="60" height="84" rx="4"/><rect x="40" y="30" width="40" height="52" rx="2"/><path d="M60 36v28M55 64h10l-2 9h-6z"/><path class="acc" d="M46 34v44M74 34v44" stroke-dasharray="3 4"/><circle class="accf" cx="60" cy="94" r="3"/>',
  warmer: '<rect x="24" y="48" width="72" height="40" rx="4"/><rect x="34" y="60" width="40" height="14" rx="2"/><path d="M74 67h10M30 67h4"/><rect x="80" y="54" width="10" height="6" rx="1"/><path class="warm" d="M40 40q4-7 8 0t8 0t8 0t8 0"/><path class="dim" d="M24 96h72M24 93v6M96 93v6"/>',
  mri: '<circle cx="48" cy="86" r="18"/><circle cx="48" cy="86" r="3"/><circle cx="88" cy="98" r="6"/><path d="M38 34l10 38h38v20"/><path d="M48 72l-4-26"/><path d="M60 72V56h24"/><rect class="acc" x="78" y="22" width="22" height="16" rx="2"/><text x="81.5" y="34.5">MR</text>',
  gown: '<path d="M42 28l12-6q6 7 12 0l12 6 14 18-10 6-4-6 2 58H40l2-58-4 6-10-6z"/><path d="M54 22v16q6 4 12 0V22"/><path class="acc" d="M46 62h28"/>'
};

const renderSVG = (key) => (
  <svg viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true" dangerouslySetInnerHTML={{ __html: ART[key] }} style={{ width: '100%', height: '100%' }} />
);

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFeaturedProducts().then(setFeatured).catch(console.error);
  }, []);

  useEffect(() => {
    document.title = "VDS | Victoria Diagnostic Supplies — Medical Consumables & Radiology Equipment, Australia";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute(
        'content',
        'Medical consumables and radiology equipment supplied to Australian clinics, hospitals and imaging departments — with manufacturer relationships behind the range for anything more specific.'
      );
    }
  }, []);

  const canvasRef = useRef(null);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const full = true;
    const ctx = cv.getContext("2d");
    let W, H, dpr, dots = [];
    
    function rnd(s) {
      return () => {
        s = (s * 16807) % 2147483647;
        return s / 2147483647;
      };
    }
    
    function build() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = cv.getBoundingClientRect();
      W = r.width;
      H = r.height;
      if (!W || !H) return;
      cv.width = W * dpr;
      cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dots = [];
      const R = rnd(7);
      const ax = W / 2, ay = H * 0.06, rad = H * 0.9, half = 0.62, n = full ? 4200 : 2600;
      for (let k = 0; k < n; k++) {
        const a = (R() * 2 - 1) * half, rr = 0.08 + Math.sqrt(R()) * 0.92;
        let I = Math.pow(R(), 2.2);
        const x = ax + Math.sin(a) * rr * rad, y = ay + Math.cos(a) * rr * rad;
        if (rr < 0.16) I *= 1.7;
        const cx = 0.12, cy = 0.58, d = Math.hypot((a - cx) / 0.28, (rr - cy) / 0.14);
        if (d < 1) I *= 0.06;
        else if (d < 1.18) I = Math.min(1, I * 2.4 + 0.35);
        if (rr > cy + 0.12 && Math.abs(a - cx) < 0.22) I *= 1.5;
        const band = Math.abs(rr - (0.36 + 0.05 * Math.sin(a * 4)));
        if (band < 0.012) I = Math.min(1, I + 0.6);
        dots.push({ x, y, a, I, s: 0.6 + R() * 1.4 });
      }
    }
    
    build();
    let sweep = -0.62, dir = 1, last = performance.now();
    let animFrameId;
    
    function frame(now) {
      const dt = Math.min(50, now - last) / 1000;
      last = now;
      if (!cv.isConnected) return;
      ctx.clearRect(0, 0, W, H);
      sweep += dir * dt * 0.5;
      if (sweep > 0.62) { sweep = 0.62; dir = -1; }
      if (sweep < -0.62) { sweep = -0.62; dir = 1; }
      for (const d of dots) {
        const lag = (sweep - d.a) * dir;
        let p = lag < 0 ? 0.25 : Math.max(0.25, 1 - lag * 0.9);
        const v = d.I * p;
        ctx.fillStyle = `rgba(${200 + 55 * v | 0},${210 + 45 * v | 0},${230 + 25 * v | 0},${Math.min(1, v * 0.95)})`;
        ctx.fillRect(d.x, d.y, d.s, d.s);
      }
      if (full) {
        const ax = W / 2, ay = H * 0.06, rad = H * 0.9;
        ctx.strokeStyle = "rgba(140,158,255,.55)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(ax + Math.sin(sweep) * rad, ay + Math.cos(sweep) * rad);
        ctx.stroke();
      }
      if (!reduced) animFrameId = requestAnimationFrame(frame);
    }
    
    animFrameId = requestAnimationFrame(frame);
    const ro = new ResizeObserver(() => {
      build();
      if (reduced) animFrameId = requestAnimationFrame(frame);
    });
    ro.observe(cv);
    
    return () => {
      cancelAnimationFrame(animFrameId);
      ro.disconnect();
    };
  }, []);

  return (
    <>
      <main className="home">


        {/* ── Hero Section ── */}
        <header className="home__hero">
          <div className="container">
            <div className="home__hero-inner">
            <div className="home__hero-content">
              <span className="section-badge" style={{ marginBottom: '16px', display: 'inline-block' }}>Direct importer · Medical consumables · Australia</span>
              <h1 className="home__hero-title">
                Diagnostic supplies, <em>direct.</em>
              </h1>
              <p className="home__hero-subtitle">
               VDS imports radiology and clinical consumables straight from the manufacturer, holds the ARTG sponsorship , and supplies clinics across Australia. Put us next to your current supplier, line by line.
              </p>
              <div className="home__hero-actions">
                <Button as={Link} to="/request-quote" variant="primary" size="lg" iconRight={ArrowRight}>
                  Request a quote
                </Button>
                <Button as={Link} to="/products" variant="secondary" size="lg">
                  Browse the range
                </Button>
              </div>
              
              <form 
                className="hero-searchbar" 
                role="search" 
                onSubmit={async (e) => { 
                  e.preventDefault(); 
                  const q = document.getElementById('hq').value.trim();
                  if (!q) return;

                  try {
                    const allProds = await fetchProducts();
                    const exactMatch = allProds.find(p => 
                      p.name.toLowerCase() === q.toLowerCase() || 
                      p.sku.toLowerCase() === q.toLowerCase()
                    );
                    
                    if (exactMatch) {
                      navigate(`/product/${exactMatch.id}`);
                    } else {
                      navigate('/products?search=' + encodeURIComponent(q));
                    }
                  } catch (err) {
                    navigate('/products?search=' + encodeURIComponent(q));
                  }
                }}
              >
                <svg width="18" height="18" viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" strokeWidth="1.6"/><path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.6"/></svg>
                <label htmlFor="hq" className="sr-only">Search the range</label>
                <input id="hq" type="text" placeholder="What do you need? Try “probe disinfection”" autoComplete="off" />
                <button type="submit" className="hero-search-btn">Search</button>
              </form>
            </div>

            {/* Premium 3D Disinfector Render Display */}
            <div className="home__hero-media">
              <div className="plate" role="img" aria-label="Animated ultrasound sector scan">
                <canvas ref={canvasRef} id="scan"></canvas>
                <div className="hud" aria-hidden="true">
                  <div className="hud-row">
                    <span>VDS · Direct supply<br /><span className="hud-dim">Clyde North · VIC</span></span>
                    <span style={{ textAlign: 'right' }}>Gain 62<br /><span className="hud-dim">Depth 14 cm</span></span>
                  </div>
                  <div className="hud-row" style={{ alignItems: 'flex-end' }}>
                    <span className="tag">Coupling gel · ARTG 530981</span>
                    <span className="hud-scale hud-dim"><span>0</span><span>5</span><span>10</span></span>
                  </div>
                </div>
              </div>
              </div>
            </div>

            <div className="home__hero-stats-banner">
              <div className="stat-item">
                <span className="stat-eyebrow">ARTG 530981</span>
                <strong>Coupling gel · VDS is sponsor</strong>
              </div>
              <div className="stat-item">
                <span className="stat-eyebrow">Direct import</span>
                <strong>Manufacturer → VDS → you</strong>
              </div>
              <div className="stat-item">
                <span className="stat-eyebrow">Nurse-founded</span>
                <strong>Clinical teams, hospitals & aged care</strong>
              </div>
              <div className="stat-item">
                <span className="stat-eyebrow">Australia-wide</span>
                <strong>Based in Clyde North, VIC</strong>
              </div>
            </div>
          </div>
        </header>





        {/* ── The Range (Categories) Section ── */}
        <section className="home__section featured-section">
          <div className="container">
            <div className="home__section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div>
                <span className="section-badge">The range</span>
                <h2 className="home__section-title" style={{ marginBottom: 0 }}>What we supply</h2>
              </div>
              <Button as={Link} to="/products" variant="outline" size="sm" iconRight={ChevronRight}>
                All 9 product lines
              </Button>
            </div>

            <div className="home__categories-grid" style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
              gap: '1rem',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              borderLeft: '1px solid rgba(255,255,255,0.05)'
            }}>
              {[
                { name: 'Medical Imaging Consumables', lines: '3 lines', desc: 'Coupling gel, print media, and radiation protection.', iconKey: 'gel' },
                { name: 'Infection Prevention', lines: '2 lines', desc: 'Disposable gowns, bedsheets, and related apparel.', iconKey: 'gown' },
                { name: 'Furniture and Patient Transfer', lines: '2 lines', desc: 'Examination couches and MRI safe wheelchairs.', iconKey: 'mri' },
                { name: 'Medical Equipment', lines: '3 lines', desc: 'Gel warmers, warming cabinets, and UV-C probe disinfectors.', iconKey: 'warmer' },
                { name: 'Everyday Paper Supplies', lines: '3 lines', desc: 'Medical rolls and tissue papers.', iconKey: 'uvc' }
              ].map((cat, idx) => {
                return (
                <Link to={`/products?cat=${cat.name}`} key={idx} style={{
                  padding: '1.4rem',
                  borderRight: '1px solid rgba(255,255,255,0.05)',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  display: 'grid',
                  gridTemplateColumns: '1fr 84px',
                  gap: '0.6rem 1rem',
                  alignItems: 'start',
                  textDecoration: 'none',
                  background: 'rgba(255, 255, 255, 0.012)',
                  transition: 'background 0.2s',
                  position: 'relative'
                }} className="cat-card-hover">
                  <div style={{ gridColumn: 1, display: 'flex', flexDirection: 'column', gap: '0.6rem', height: '100%' }}>
                    <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.75rem', color: 'var(--ink-soft)' }}>{cat.lines}</span>
                    <h3 style={{ fontSize: '1.1rem', color: 'var(--ink)', margin: 0 }}>{cat.name}</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--ink-soft)', flex: 1, margin: 0 }}>{cat.desc}</p>
                  </div>
                  <div className="cat-art-svg" style={{ gridColumn: 2, gridRow: '1 / 4', width: '84px', height: '84px', color: 'var(--cyan)' }}>
                    {renderSVG(cat.iconKey)}
                  </div>
                </Link>
                );
              })}
            </div>

            <p style={{ marginTop: '1.2rem', fontSize: '0.92rem', color: 'var(--ink-soft)' }}>
              Need something that isn't listed? We source from manufacturers, so <Link to="/request-quote" style={{ textDecoration: 'underline', color: 'var(--cyan)' }}>ask us</Link>.
            </p>
          </div>
        </section>

        {/* ── Why Practices Switch ── */}
        <section id="customer-value" className="home__section switching-section">
          <div className="container">
            <div className="home__section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div>
                <span className="section-badge">Why VDS</span>
                <h2 className="home__section-title" style={{ marginBottom: 0 }}>Three things that change<br />what you pay and who you deal with</h2>
              </div>
            </div>

            <div className="process-flow-container">
              {/* Horizontal connecting line behind cards */}
              <div className="process-flow-line"></div>

              <div className="process-flow-grid">
                {/* Step 1 */}
                <div className="process-flow-card">
                  <div className="process-step-badge step-1">
                    <span>01</span>
                  </div>
                  <span className="why-vds-eyebrow" style={{ marginTop: 'auto', marginBottom: '8px' }}>FEWER HANDS</span>
                  <h4>We import it ourselves</h4>
                  <p>
                    Product comes from the manufacturer to us and then to you. No wholesaler in between taking a margin.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="process-flow-card">
                  <div className="process-step-badge step-2">
                    <span>02</span>
                  </div>
                  <span className="why-vds-eyebrow" style={{ marginTop: 'auto', marginBottom: '8px' }}>ONE ACCOUNTABLE PARTY</span>
                  <h4>We hold the sponsorship</h4>
                  <p>
                    For lines we sponsor on the ARTG, regulatory questions and recalls come straight to us. The first, our coupling gel, is ARTG 530981.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="process-flow-card">
                  <div className="process-step-badge step-3">
                    <span>03</span>
                  </div>
                  <span className="why-vds-eyebrow" style={{ marginTop: 'auto', marginBottom: '8px' }}>CLINICAL JUDGEMENT</span>
                  <h4>Founded by a nurse</h4>
                  <p>
                    VDS was started by an endorsed enrolled nurse who's led clinical teams in hospitals and aged care. We choose products the way a clinician would.
                  </p>
                </div>
              </div>
            </div>


          </div>
        </section>

        {/* ── Industries Section ── */}
        <section className="home__section industries-section">
          <div className="container">
            <div className="home__section-header">
              <div>
                <span className="section-badge">Who we supply</span>
                <h2 className="home__section-title">Built for the people who keep clinics stocked</h2>
              </div>
              <Button as={Link} to="/industries" variant="secondary" size="sm" iconRight={ChevronRight} style={{ color: 'var(--cyan)' }}>
                All industries
              </Button>
            </div>

            <div className="home__categories-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
              {INDS.map((ind, i) => {
                const images = [imgRad, imgHos, imgGp, imgAh, imgAc];
                return (
                  <Link to={`/industries/${ind.id}`} key={ind.code} className="ind-card" style={{ backgroundImage: `url(${images[i]})`, textDecoration: 'none', color: 'inherit' }}>
                    <span className="why-vds-eyebrow">{ind.code}</span>
                    <h4>{ind.name}</h4>
                    <p>{ind.short}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
        {/* ── Price Check Section ── */}
        <section className="home__section price-check-section">
          <div className="container">
            <div className="price-check-card">
              <div className="price-check-left">
                <span className="price-check-eyebrow">Price check</span>
                <h2>Send us your last invoice.</h2>
                <p>We'll quote the same lines, in the same quantities, so you can compare without doing the legwork.</p>
                <div className="price-check-actions">
                  <Button as={Link} to="/request-quote" variant="primary" iconRight={ArrowRight}>Start a price check</Button>
                </div>
              </div>
              <div className="price-check-right">
                <div className="price-check-step">
                  <span className="step-number">01</span>
                  <div className="step-content">
                    <h4>Share what you buy now</h4>
                    <p>An invoice, a product list or a photo of the storeroom shelf.</p>
                  </div>
                </div>
                <div className="price-check-step">
                  <span className="step-number">02</span>
                  <div className="step-content">
                    <h4>We match it line by line</h4>
                    <p>Same product types and quantities, with the regulatory details attached.</p>
                  </div>
                </div>
                <div className="price-check-step">
                  <span className="step-number">03</span>
                  <div className="step-content">
                    <h4>You compare and decide</h4>
                    <p>No lock-in. Switch the lines that make sense.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Quote Section ── */}
        <section className="home__section quote-section">
          <div className="container">
            <div className="quote-container">
              <div className="quote-avatar">
                <span className="quote-avatar-text">VDS</span>
              </div>
              <div className="quote-content">
                <blockquote>
                  “I've stood in the storeroom at 2am looking for something that wasn't there. VDS exists so that happens less.”
                </blockquote>
                <div className="quote-author">
                  Harsh, co-founder &middot; Endorsed enrolled nurse &middot; <Link to="/about">Read our story</Link>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>
    </>
  );
}
