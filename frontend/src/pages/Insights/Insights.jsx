import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Insights.css';

const ARTICLES = [
  {id: "artg-check", title: "How to check an ARTG entry before you buy", tag: "Procurement guide", mins: 5, ready: true, dek: "A five-minute check that tells you whether a medical device is legally supplied in Australia, and who answers for it."},
  {id: "apron-care", title: "Lead aprons: what to record between inspections", tag: "In draft", ready: false, dek: "Storage, handling and the records worth keeping between scheduled checks."},
  {id: "contrast-warming", title: "Warming contrast media: questions to ask a supplier", tag: "In draft", ready: false, dek: "Capacity, temperature control and the details to confirm before buying."},
  {id: "uvc-where", title: "Where UV-C fits in probe reprocessing", tag: "In draft", ready: false, dek: "What to check against your probe manufacturer's instructions before changing your process."}
];

export default function Insights() {
  useEffect(() => {
    document.title = "Insights | VDS";
    window.scrollTo(0, 0);
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
                  <span className="chip">{a.tag} • {a.mins} min</span>
                  <h3>{a.title}</h3>
                  <p>{a.dek}</p>
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
