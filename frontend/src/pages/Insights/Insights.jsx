import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './Insights.css';

const ARTICLES = [
  {id: "artg-guide", title: "How to check an ARTG entry before you buy", tag: "Procurement guide", mins: 5, ready: true, dek: "A five-minute check that tells you whether a medical device is legally supplied in Australia, and who answers for it."},
  {id: "apron-care", title: "Lead aprons: what to record between inspections", tag: "In draft", ready: false, dek: "Storage, handling and the records worth keeping between scheduled checks."},
  {id: "contrast-warming", title: "Warming contrast media: questions to ask a supplier", tag: "In draft", ready: false, dek: "Capacity, temperature control and the details to confirm before buying."},
  {id: "uvc-where", title: "Where UV-C fits in probe reprocessing", tag: "In draft", ready: false, dek: "What to check against your probe manufacturer's instructions before changing your process."}
];

export default function Insights() {
  const canvasRef = useRef(null);

  useEffect(() => {
    document.title = "Insights | VDS";
    window.scrollTo(0, 0);
  }, []);

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
    <main className="insights-page">
      <div className="phead">
        <div className="container stack-lg">
          <div className="crumbs">
            <Link to="/">Home</Link>
            <span>/</span>
            <span>Insights</span>
          </div>
          <h1>Guides for people who buy for clinics</h1>
          <p className="lede">
            Practical notes on regulation, product care and procurement. Written to be useful, not to sell.
          </p>
        </div>
      </div>

      <section className="band">
        <div className="container articles">
          {ARTICLES.map((a, i) => {
            if (i === 0) {
              return (
                <Link key={a.id} className="art-card lead" to={a.ready ? `/insights/${a.id}` : '#'}>
                  <canvas ref={canvasRef} id="scan-insights" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, opacity: 0.6 }}></canvas>
                  <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <span className="chip">{a.tag} • {a.mins} min</span>
                    <h3 style={{ marginTop: 'auto' }}>{a.title}</h3>
                    <p>{a.dek}</p>
                  </div>
                </Link>
              );
            }
            return (
              <div key={a.id} className="art-card">
                <span className="chip">{a.tag}</span>
                <h3>{a.title}</h3>
                <p>{a.dek}</p>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
