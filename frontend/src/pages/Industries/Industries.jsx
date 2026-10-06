import { Link } from 'react-router-dom';
import './Industries.css';

export default function Industries() {
  const industries = [
    {
      code: 'RAD',
      title: 'Radiology & imaging centres',
      desc: 'Gel, protection, probe disinfection and MRI transfer for busy rooms.',
      link: '/industries/rad'
    },
    {
      code: 'HOS',
      title: 'Hospital imaging departments',
      desc: 'Documentation-first supply for procurement teams.',
      link: '/industries/hos'
    },
    {
      code: 'GP',
      title: 'GP & specialist clinics',
      desc: 'Everyday clinical consumables without the wholesaler markup.',
      link: '/industries/gp'
    },
    {
      code: 'AH',
      title: 'Allied health',
      desc: 'Gel, sheets and gowns for physio, sports and sonography practices.',
      link: '/industries/ah'
    },
    {
      code: 'AC',
      title: 'Aged care',
      desc: 'Warming cabinets, gowns and sheets for residential care.',
      link: '/industries/ac'
    }
  ];

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
            {industries.map((ind) => (
              <Link to="/products" key={ind.code} className="ind">
                <span className="code">{ind.code}</span>
                <div className="ind-body">
                  <h3>{ind.title}</h3>
                  <p>{ind.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
