import { Link } from 'react-router-dom';
import { INDS } from '../../data/industries';
import './Industries.css';

export default function Industries() {
  return (
    <main className="industries-page">
      <section className="industries-hero">
        <div className="container">
          <div className="crumbs">
            <Link to="/">Home</Link>
            <span>/</span>
            <span>Who we supply</span>
          </div>
          <h1 className="industries-title">Who we supply</h1>
          <p className="industries-lead">
            Different settings buy differently. Pick yours to see the lines that matter and how we work with you.
          </p>
        </div>
      </section>

      <section className="industries-content">
        <div className="container">
          <div className="inds">
            {INDS.map((ind) => (
              <Link to={`/industries/${ind.id}`} key={ind.code} className="ind">
                <span className="code">{ind.code}</span>
                <div className="ind-body">
                  <h3>{ind.name}</h3>
                  <p>{ind.short}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
