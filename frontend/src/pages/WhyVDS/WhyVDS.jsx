import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './WhyVDS.css';

export default function WhyVDS() {
  useEffect(() => {
    document.title = "Why VDS | Victoria Diagnostic Supplies";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute(
        'content',
        'Learn why clinical teams choose VDS. A shorter supply line, no wholesaler margin, and clinician-led accountability.'
      );
    }
    window.scrollTo(0, 0);
  }, []);

  return (
    <main className="why-page">
      {/* Hero Section */}
      <section className="why-page__hero">
        <div className="container">
          <h1 className="why-page__title">A shorter supply line.</h1>
          <p className="why-page__subtitle">
            Most clinics buy through layers of resellers. We import directly and take on the regulatory responsibility ourselves. Here's what that means for you, and what we won't claim.
          </p>
        </div>
      </section>

      {/* Diagram Section */}
      <section className="why-page__diagram-section">
        <div className="container">
          <div className="why-page__diagram-card">
            
            <div className="diagram-row">
              <span className="diagram-label">USUAL ROUTE</span>
              <div className="diagram-track">
                <div className="diagram-box">Manufacturer</div>
                <div className="diagram-line"></div>
                <div className="diagram-box diagram-box--dashed">
                  Wholesaler<br/><span>+ margin</span>
                </div>
                <div className="diagram-line"></div>
                <div className="diagram-box diagram-box--dashed">
                  Distributor<br/><span>+ margin</span>
                </div>
                <div className="diagram-line"></div>
                <div className="diagram-box">Your clinic</div>
              </div>
            </div>

            <div className="diagram-row">
              <span className="diagram-label diagram-label--blue">WITH VDS</span>
              <div className="diagram-track">
                <div className="diagram-box">Manufacturer</div>
                <div className="diagram-line diagram-line--blue"></div>
                <div className="diagram-box diagram-box--blue">
                  VDS<br/><span>importer + ARTG sponsor</span>
                </div>
                <div className="diagram-line diagram-line--blue"></div>
                <div className="diagram-box">Your clinic</div>
              </div>
            </div>

            <p className="diagram-note">
              Illustrative. Routes vary by product and supplier; ask us how a specific line reaches you.
            </p>
          </div>
        </div>
      </section>

      {/* Grid Section */}
      <section className="why-page__features">
        <div className="container">
          <div className="why-page__features-grid">
            
            <div className="feature-block">
              <span className="feature-category">PRICE</span>
              <h3 className="feature-title">No wholesaler margin</h3>
              <p className="feature-desc">
                We buy from the manufacturer. Send us your current invoice and judge the difference on your own numbers.
              </p>
            </div>

            <div className="feature-block">
              <span className="feature-category">ACCOUNTABILITY</span>
              <h3 className="feature-title">The sponsor answers</h3>
              <p className="feature-desc">
                For products we sponsor on the ARTG, you deal with the company legally responsible for them in Australia.
              </p>
            </div>

            <div className="feature-block">
              <span className="feature-category">JUDGEMENT</span>
              <h3 className="feature-title">Clinician-led</h3>
              <p className="feature-desc">
                Our founder has run clinical teams. We test products against how they're really used on shift.
              </p>
            </div>

            <div className="feature-block">
              <span className="feature-category">SERVICE</span>
              <h3 className="feature-title">After-hours supply</h3>
              <p className="feature-desc">
                When a room is about to stop, call us outside business hours and we'll work out the fastest route to stock.
              </p>
            </div>

            <div className="feature-block">
              <span className="feature-category">EVIDENCE</span>
              <h3 className="feature-title">Documents first</h3>
              <p className="feature-desc">
                Datasheets, IFUs and regulatory details go out with the quote, so procurement isn't left chasing them.
              </p>
            </div>

            <div className="feature-block">
              <span className="feature-category">REACH</span>
              <h3 className="feature-title">Melbourne-based, national</h3>
              <p className="feature-desc">
                Run from Clyde North, Victoria, supplying clinics across Australia.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Table Section */}
      <section className="why-page__table-section">
        <div className="container">
          <div className="table-header-wrap">
            <h2 className="table-main-title">What changes when you switch</h2>
          </div>

          <div className="why-page__table-card">
            <div className="why-table">
              <div className="why-table__row why-table__head">
                <div className="why-table__col">QUESTION</div>
                <div className="why-table__col">THROUGH A RESELLER CHAIN</div>
                <div className="why-table__col why-table__col--vds">WITH VDS</div>
              </div>
              
              <div className="why-table__row">
                <div className="why-table__col">Who sets the price?</div>
                <div className="why-table__col">Each layer adds a margin</div>
                <div className="why-table__col why-table__col--vds">Importer price, quoted to your account</div>
              </div>

              <div className="why-table__row">
                <div className="why-table__col">Who answers regulatory questions?</div>
                <div className="why-table__col">Passed up the chain to the sponsor</div>
                <div className="why-table__col why-table__col--vds">We do, for lines we sponsor</div>
              </div>

              <div className="why-table__row">
                <div className="why-table__col">Who handles a recall?</div>
                <div className="why-table__col">Sponsor notifies distributor, who notifies you</div>
                <div className="why-table__col why-table__col--vds">We trace by batch and contact you directly</div>
              </div>

              <div className="why-table__row">
                <div className="why-table__col">Who picks up the phone?</div>
                <div className="why-table__col">Account manager or call centre</div>
                <div className="why-table__col why-table__col--vds">The people who import the product</div>
              </div>
            </div>
          </div>
          
          <p className="table-note">
            General comparison. Some distributors are also sponsors; ask any supplier who sponsors the product you're buying.
          </p>
        </div>
      </section>
    </main>
  );
}
