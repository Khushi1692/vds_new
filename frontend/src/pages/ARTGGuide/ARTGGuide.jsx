import { useEffect } from 'react';
import { ExternalLink } from 'lucide-react';
import './ARTGGuide.css';

export default function ARTGGuide() {
  useEffect(() => {
    document.title = "How to check an ARTG entry before you buy | VDS";
    window.scrollTo(0, 0);
  }, []);

  return (
    <main className="guide-page">
      <article className="container guide__article">


        {/* Header */}
        <header className="guide__header">
          <span className="section-badge">PROCUREMENT GUIDE &middot; 5 MIN</span>
          <h1 className="guide__title">How to check an ARTG entry before you buy</h1>
          <p className="guide__subtitle">
            A five-minute check tells you whether a medical device is legally supplied in Australia, and who is responsible for it.
          </p>
        </header>

        {/* Content */}
        <div className="guide__content">
          <p className="guide__intro">
            The Australian Register of Therapeutic Goods (ARTG) lists the medical devices that can be legally supplied in Australia. Each entry names a sponsor: the company responsible for that product here. Checking an entry takes a few minutes and is worth doing for any device you buy for the first time.
          </p>

          <h2>The check</h2>
          <ol className="guide__steps">
            <li>
              Go to the TGA's public ARTG search at <a href="https://tga.gov.au/resources/artg" target="_blank" rel="noopener noreferrer">tga.gov.au/resources/artg</a>.
            </li>
            <li>
              Search by the ARTG ID your supplier gave you. If you don't have one, search by product type or sponsor name.
            </li>
            <li>
              Check that the sponsor named on the entry is the company you're buying from, or that your supplier can explain their relationship to the sponsor.
            </li>
            <li>
              Check that the product described matches what you're actually buying.
            </li>
            <li>
              Check the entry is current, not cancelled.
            </li>
            <li>
              Record the ARTG ID against the product in your purchasing records.
            </li>
          </ol>

          <h2>When there's no entry</h2>
          <p>
            Not everything in a clinic is a therapeutic good. Some general-purpose items aren't regulated as medical devices, so a missing entry isn't always a problem. Ask the supplier how the product is classified and why. A good supplier will answer in writing.
          </p>

          <div className="guide__callout">
            <strong>Try it on ours.</strong> Our coupling gel is ARTG 530981, sponsored by Victoria Diagnostic Supplies Pty Ltd. 
            {' '}
            <a href="https://www.tga.gov.au/resources/artg/530981" target="_blank" rel="noopener noreferrer" className="inline-link">
              View the entry <ExternalLink size={14} style={{ display: 'inline', marginBottom: '-2px' }}/>
            </a>
          </div>

          <div className="guide__disclaimer">
            General guidance only. For your obligations, refer to the TGA or your own regulatory adviser.
          </div>
        </div>
      </article>
    </main>
  );
}
