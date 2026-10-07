import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ExternalLink } from 'lucide-react';
import Button from '../../components/Button/Button';
import './Quality.css';

export default function Quality() {
  useEffect(() => {
    document.title = "Quality & ARTG | VDS";
    window.scrollTo(0, 0);
  }, []);

  return (
    <main className="quality-page">
      {/* ── Hero Section ── */}
      <section className="quality__hero">
        <div className="container">
          <div className="quality__breadcrumbs">
            <span className="current">Quality & ARTG</span>
          </div>
          <div className="quality__hero-inner">
            <h1 className="quality__hero-title">
              If it isn't linked, <br/>we don't claim it.
            </h1>
            <p className="quality__hero-subtitle">
              We publish an ARTG number only when you can click through to the public entry and check it yourself. For everything else, we send the regulatory details before you order.
            </p>
          </div>
        </div>
      </section>

      {/* ── Published Inclusions ── */}
      <section className="quality__section">
        <div className="container">
          <div className="quality__split">
            <div className="quality__split-left">
              <span className="section-badge">PUBLISHED INCLUSIONS</span>
              <h2 className="quality__section-title">ARTG entries sponsored by VDS</h2>
              <p className="quality__section-text">
                Victoria Diagnostic Supplies Pty Ltd is an ARTG sponsor. We'll add each inclusion here as it's confirmed.
              </p>
            </div>
            
            <div className="quality__split-right">
              <div className="artg-card">
                <div className="artg-table-header">
                  <span className="col-id">ARTG ID</span>
                  <span className="col-entry">ENTRY</span>
                  <span className="col-date">INCLUDED</span>
                  <span className="col-action">CHECK IT</span>
                </div>
                <div className="artg-table-row">
                  <span className="col-id">530981</span>
                  <span className="col-entry">Gel, ultrasonic coupling</span>
                  <span className="col-date">04 Sep 2026</span>
                  <span className="col-action">
                    <a href="https://www.tga.gov.au/resources/artg/530981" target="_blank" rel="noopener noreferrer" className="external-link">
                      tga.gov.au <ExternalLink size={14} />
                    </a>
                  </span>
                </div>
              </div>

              <div className="artg-notice">
                <strong>Asking about another product?</strong> We'll send its classification, ARTG details where they apply, and the manufacturer documents with your quote. <Link to="/request-quote?need=Documents" className="inline-link">Request documents</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── What a Sponsor Does ── */}
      <section className="quality__section alt-bg">
        <div className="container">
          <div className="quality__split">
            <div className="quality__split-left">
              <span className="section-badge">WHAT A SPONSOR DOES</span>
              <h2 className="quality__section-title">Why it matters who the sponsor is</h2>
            </div>
            
            <div className="quality__split-right">
              <div className="sponsor-text">
                <p>
                  In Australia, the sponsor is the company legally responsible for a medical device on the ARTG. They hold the evidence that the product meets the essential principles, report adverse events to the TGA and run any recall.
                </p>
                <p>
                  When the supplier you buy from is also the sponsor, there's no one else to chase. You get answers from the business that holds the evidence.
                </p>
              </div>

              <div className="sponsor-list-wrapper">
                <h3 className="sponsor-list-title">What we keep for every line we supply</h3>
                <ul className="sponsor-list">
                  <li>Manufacturer documentation and instructions for use</li>
                  <li>Supply records by batch, so a recall reaches the right clinics</li>
                  <li>A record of the regulatory basis for supply</li>
                </ul>
                <Link to="/insights/artg-guide" className="sponsor-guide-link">
                  How to check any ARTG entry yourself &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Documents we can send ── */}
      <section className="quality__section">
        <div className="container">
          <div className="quality__header">
            <h2 className="quality__section-title">Documents we can send</h2>
          </div>
          
          <div className="documents-card">
            <div className="doc-table-header">
              <span className="col-doc">DOCUMENT</span>
              <span className="col-desc">WHAT IT TELLS YOU</span>
              <span className="col-how">HOW TO GET IT</span>
            </div>
            
            <div className="doc-table-row">
              <span className="col-doc">ARTG entry</span>
              <span className="col-desc">The product is included for supply in Australia, and who the sponsor is</span>
              <span className="col-how">Public link, or with your quote</span>
            </div>
            
            <div className="doc-table-row">
              <span className="col-doc">Instructions for use</span>
              <span className="col-desc">Intended use, cleaning and handling as set by the manufacturer</span>
              <span className="col-how">With your quote</span>
            </div>
            
            <div className="doc-table-row">
              <span className="col-doc">Datasheet</span>
              <span className="col-desc">Dimensions, materials and performance figures</span>
              <span className="col-how">With your quote</span>
            </div>
            
            <div className="doc-table-row">
              <span className="col-doc">Safety data sheet</span>
              <span className="col-desc">Handling and storage for chemical products such as gel</span>
              <span className="col-how">With your quote</span>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
